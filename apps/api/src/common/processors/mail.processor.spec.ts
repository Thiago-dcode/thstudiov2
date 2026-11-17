const logger: Record<string, jest.Mock> = {
  name: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  critical: jest.fn(),
  warn: jest.fn(),
};

import { FactoryLogService, LogService, configureLogProcess } from '@repo/backend-lib/services/log-service';
import { ConsoleLogService } from '@repo/backend-lib/services/log-service';
import { JOB_ERROR_500_MAIL, JOB_SEND_BATCH_EMAIL, JOB_SEND_MAIL } from '@repo/common-lib/constants/queues';
import { MailProcessor } from './mail.processor';

const flushAsync = jest.fn();

const build = () => {
  const create = jest.spyOn(FactoryLogService, 'createLogService').mockReturnValue(logger as unknown as LogService);
  const mailService = { send: jest.fn(), sendRaw: jest.fn(), sendBatchRaw: jest.fn() };
  const processor = new MailProcessor(mailService as any, {} as any, { flushAsync } as unknown as LogService);
  return { processor, mailService, create };
};

/** A fake BullMQ job on attempt `attempt` of `max`. */
const jobOf = (name: string, data: unknown, attempt = 1, max = 3): any => ({
  id: 'j1',
  name,
  data,
  queueName: 'mail',
  attemptsMade: attempt - 1,
  opts: { attempts: max },
});

const everything = () =>
  JSON.stringify(Object.values(logger).map((fn) => fn.mock.calls));

describe('MailProcessor alerting and lines', () => {
  beforeEach(() => {
    Object.values(logger).forEach((fn) => fn.mockReset());
    logger.name.mockReturnValue(logger);
    flushAsync.mockReset().mockResolvedValue(undefined);
    // The job wrapper flushes in process; keep the unit test away from real log files.
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-14: the processor logger carries its channel in the config', () => {
    const { create } = build();
    expect(create.mock.calls.at(-1)?.[1]).toEqual({ channel: 'mail' });
  });

  it('AC-32: a successful single mail logs "Mail sent" with the recipient count and provider id', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockResolvedValue({ data: { id: 'prov-1' }, accepted: ['a@b.c'], envelope: { to: ['a@b.c'] } });
    await processor.process(jobOf(JOB_SEND_MAIL, { to: 'a@b.c', from: 'x@y.z', subject: 'Hi' }));
    const [message, extra, fields] = logger.info.mock.calls[0];
    expect(message).toBe('Mail sent');
    expect(extra).toMatchObject({ recipient_count: 1, provider_message_id: 'prov-1' });
    expect(typeof extra.duration_ms).toBe('number');
    expect(fields).toEqual({ operation: 'send-mail' });
  });

  it('AC-32: recipient_count counts an array of recipients', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockResolvedValue({ id: 'p' });
    await processor.process(jobOf(JOB_SEND_MAIL, { to: ['a@b.c', 'd@e.f'], subject: 's' }));
    expect(logger.info.mock.calls[0][1].recipient_count).toBe(2);
  });

  it('AC-32: batch success logs "Batch mail sent" with the count', async () => {
    const { processor, mailService } = build();
    mailService.sendBatchRaw.mockResolvedValue({});
    await processor.process(jobOf(JOB_SEND_BATCH_EMAIL, [{ to: 'a@b.c' }, { to: 'd@e.f' }]));
    expect(logger.info.mock.calls[0][0]).toBe('Batch mail sent');
    expect(logger.info.mock.calls[0][1].count).toBe(2);
  });

  it('AC-32: no line carries an address, a to/from/email/subject key or the provider response', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockResolvedValue({ data: { id: 'p1' }, accepted: ['a@b.c'], envelope: { from: 'x@y.z' } });
    await processor.process(jobOf(JOB_SEND_MAIL, { to: 'a@b.c', from: 'x@y.z', subject: 'Reset code', html: '<b>123456</b>' }));
    mailService.sendBatchRaw.mockResolvedValue({ accepted: ['a@b.c'] });
    await processor.process(jobOf(JOB_SEND_BATCH_EMAIL, [{ to: 'a@b.c', subject: 'Reset code' }]));
    const dumped = everything();
    expect(dumped).not.toContain('@');
    expect(dumped).not.toMatch(/"(to|from|email|subject|provider_response|accepted|envelope)"/);
    expect(dumped).not.toContain('Reset code');
    expect(dumped).not.toContain('123456');
  });

  it('AC-32: a send failure on attempt 1/3 logs error with will_retry and no critical', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockRejectedValue(new Error('provider 500'));
    await expect(processor.process(jobOf(JOB_SEND_MAIL, { to: 'a@b.c' }, 1, 3))).rejects.toThrow('provider 500');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toBe('Mail send failed');
    expect(logger.error.mock.calls[0][1]).toMatchObject({ will_retry: true, error_message: 'provider 500' });
    expect(logger.critical).not.toHaveBeenCalled();
  });

  it('AC-32: a send failure on the final attempt 3/3 logs exactly one critical', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockRejectedValue(new Error('provider 500'));
    await expect(processor.process(jobOf(JOB_SEND_MAIL, { to: 'a@b.c' }, 3, 3))).rejects.toThrow('provider 500');
    expect(logger.critical).toHaveBeenCalledTimes(1);
    expect(logger.critical.mock.calls[0][0]).toBe('Mail send failed permanently');
    expect(logger.critical.mock.calls[0][1]).toMatchObject({ will_retry: false });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('AC-32: batch failures follow the same final-only rule', async () => {
    const { processor, mailService } = build();
    mailService.sendBatchRaw.mockRejectedValue(new Error('provider 500'));
    await expect(processor.process(jobOf(JOB_SEND_BATCH_EMAIL, [{ to: 'a@b.c' }], 2, 3))).rejects.toThrow();
    expect(logger.critical).not.toHaveBeenCalled();
    expect(logger.error.mock.calls[0][1]).toMatchObject({ will_retry: true, count: 1 });
    logger.error.mockClear();
    await expect(processor.process(jobOf(JOB_SEND_BATCH_EMAIL, [{ to: 'a@b.c' }], 3, 3))).rejects.toThrow();
    expect(logger.critical).toHaveBeenCalledTimes(1);
    expect(logger.critical.mock.calls[0][0]).toBe('Mail send failed permanently');
  });

  it('AC-22: a failing alert mail logs error, never critical, on every attempt, and the handler is not called', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'api', onCritical: handler });
    const { processor, mailService } = build();
    mailService.send.mockRejectedValue(new Error('smtp down'));
    for (const attempt of [1, 3]) {
      await expect(
        processor.process(jobOf(JOB_ERROR_500_MAIL, { message: 'm', options: {}, subject: 'S' }, attempt, 3)),
      ).rejects.toThrow('smtp down');
    }
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error.mock.calls[0][0]).toBe('Alert mail send failed');
    expect(logger.critical).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('AC-22: through the real LogService dispatch path the handler is still not called', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'api', onCritical: handler });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(FactoryLogService, 'createLogService').mockImplementation((_t, cfg) => new ConsoleLogService(cfg));
    const mailService = { send: jest.fn().mockRejectedValue(new Error('smtp down')) };
    const processor = new MailProcessor(mailService as any, {} as any, { flushAsync } as unknown as LogService);
    await expect(
      processor.process(jobOf(JOB_ERROR_500_MAIL, { message: 'm', options: {} }, 3, 3)),
    ).rejects.toThrow('smtp down');
    await new Promise((r) => setImmediate(r));
    expect(handler).not.toHaveBeenCalled();
  });

  it('AC-32: the logger is flushed whether the job succeeds or fails', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockResolvedValue({ id: 1 });
    await processor.process(jobOf(JOB_SEND_MAIL, { to: 'a@b.c' }));
    mailService.sendRaw.mockRejectedValue(new Error('x'));
    await expect(processor.process(jobOf(JOB_SEND_MAIL, { to: 'a@b.c' }))).rejects.toThrow();
    expect(flushAsync).toHaveBeenCalledTimes(2);
  });

  // The error message of a failed send must not carry the recipient (provider errors quote it).
  it('AC-32: a provider error quoting a recipient is masked in the logged error_message', async () => {
    const { processor, mailService } = build();
    mailService.sendRaw.mockRejectedValue(new Error('Invalid to: ross@example.com, alice@ssl.example.org'));
    await expect(processor.process(jobOf(JOB_SEND_MAIL, { to: 'x' }, 1, 3))).rejects.toThrow();
    const logged = JSON.stringify(logger.error.mock.calls);
    expect(logged).not.toContain('ross@example.com');
    expect(logged).not.toContain('alice@ssl.example.org');
  });
});
