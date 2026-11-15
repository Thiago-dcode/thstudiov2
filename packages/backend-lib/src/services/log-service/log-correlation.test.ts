import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { format } from 'date-fns';
import { ConsoleLogService } from './console-log.service';
import { FileLogService } from './file-log.service';
import { LogService } from './log.service';
import { addLogCorrelation, runWithLogContext, setLogTraceId } from './log-context';
import { configureLogProcess } from './process-context';
import { LOG_CORRELATION_KEYS, LogConfig } from './types';
import { RequestLogContext } from '@repo/common-lib/types/request';

const request: RequestLogContext = {
  id: 'T',
  method: 'GET',
  path: '/x',
  ip_address: null,
  user_agent: null,
  user_id: 1,
  user_role: 'USER',
  language: null,
  unattributed_app_call: false,
};

const capture = (config: LogConfig, fn: (logger: ConsoleLogService) => void) => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  fn(new ConsoleLogService(config));
  const lines = spy.mock.calls.map((c) => JSON.parse(c[0] as string));
  spy.mockRestore();
  return lines;
};

describe('log correlation', () => {
  beforeEach(() => configureLogProcess({ service: 'api' }));
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-2: context + fields merge, fields win, canonical order, unknown keys dropped', () => {
    const [line] = capture({ channel: 'auth' }, (logger) =>
      runWithLogContext({ id: 'T', correlation: { queue: 'q', user_id: 5 } }, () =>
        logger.info('m', { a: 1 }, {
          correlation: { stripe_customer_id: 'cus_1', user_id: 6, evil: 'x' } as any,
        }),
      ),
    );
    expect(Object.keys(line)).toEqual(['timestamp', 'service', 'replica', 'channel', 'operation', 'level', 'id', 'message', 'correlation', 'extraInfo']);
    expect(line.correlation).toEqual({ user_id: 6, queue: 'q', stripe_customer_id: 'cus_1' });
    expect(Object.keys(line.correlation)).toEqual(['user_id', 'queue', 'stripe_customer_id']);
    expect('evil' in line.correlation).toBe(false);
  });

  it('AC-2: the canonical key list is the documented order', () => {
    expect([...LOG_CORRELATION_KEYS]).toEqual([
      'user_id', 'job_id', 'job_name', 'queue', 'attempt', 'parent_job_id', 'cron', 'media_id',
      'stripe_event_id', 'stripe_event_type', 'stripe_request_id', 'stripe_customer_id',
      'stripe_subscription_id', 'stripe_checkout_session_id', 'stripe_invoice_id',
    ]);
  });

  it('AC-2: correlation sits after status_code and before request', () => {
    const [line] = capture({ channel: 'auth', request: () => request }, (logger) =>
      logger.info('m', undefined, { status_code: 200, correlation: { user_id: 1 } }),
    );
    expect(Object.keys(line)).toEqual(['timestamp', 'service', 'replica', 'channel', 'operation', 'level', 'id', 'message', 'status_code', 'status', 'correlation', 'request']);
  });

  it('AC-2: no correlation key when nothing is set, and wrongly typed values are dropped', () => {
    const [a] = capture({ channel: 'auth' }, (logger) => logger.info('m'));
    expect('correlation' in a).toBe(false);
    const [b] = capture({ channel: 'auth' }, (logger) =>
      logger.info('m', undefined, { correlation: { user_id: '5', job_id: 7 } as any }),
    );
    expect('correlation' in b).toBe(false);
  });

  it('AC-3: a logger without id/request config takes them from the context', () => {
    const [line] = capture({ channel: 'users' }, (logger) =>
      runWithLogContext({ id: 'T', request: () => request }, () => logger.info('m')),
    );
    expect(line.id).toBe('T');
    expect(line.request).toEqual(request);
  });

  it('AC-3: an id() returning null falls back to the context id; a config id wins', () => {
    const lines = capture({ channel: 'users', id: () => null }, (logger) =>
      runWithLogContext({ id: 'T' }, () => logger.info('m')),
    );
    expect(lines[0].id).toBe('T');
    const withId = capture({ channel: 'users', id: 'X' }, (logger) =>
      runWithLogContext({ id: 'T' }, () => logger.info('m')),
    );
    expect(withId[0].id).toBe('X');
  });

  it('AC-3: outside any context: id null and no request key', () => {
    const [line] = capture({ channel: 'users' }, (logger) => logger.info('m'));
    expect(line.id).toBeNull();
    expect('request' in line).toBe(false);
  });

  it('AC-3: a config request wins over the context request', () => {
    const own = { ...request, id: 'own' };
    const [line] = capture({ channel: 'users', request: () => own }, (logger) =>
      runWithLogContext({ id: 'T', request: () => request }, () => logger.info('m')),
    );
    expect(line.request.id).toBe('own');
  });

  it('AC-4: per-call operation wins for that call only; config is not mutated', () => {
    const lines = capture({ channel: 'users', name: 'cfg' }, (logger) => {
      logger.info('1', undefined, { operation: 'op1' });
      logger.info('2');
    });
    expect(lines.map((l) => l.operation)).toEqual(['op1', 'cfg']);
  });

  describe('AC-5: file snapshot', () => {
    let folder: string;
    beforeEach(() => {
      folder = fs.mkdtempSync(path.join(os.tmpdir(), 'corr-'));
    });
    afterEach(() => fs.rmSync(folder, { recursive: true, force: true }));

    it('freezes id and correlation at call time', async () => {
      const logger = new FileLogService({ logFolder: folder, channel: 'auth' });
      runWithLogContext({ id: 'A', correlation: { user_id: 1 } }, () => {
        logger.info('first');
        setLogTraceId('B');
        addLogCorrelation({ job_id: 'j2' });
        logger.info('second');
      });
      await LogService.flush();
      const file = path.join(folder, 'api', `${format(new Date(), 'yyyy-MM-dd')}.log`);
      const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
      const first = lines.find((l) => l.message === 'first');
      const second = lines.find((l) => l.message === 'second');
      expect(first.id).toBe('A');
      expect(first.correlation).toEqual({ user_id: 1 });
      expect(second.id).toBe('B');
      expect(second.correlation).toEqual({ user_id: 1, job_id: 'j2' });
    });
  });
});
