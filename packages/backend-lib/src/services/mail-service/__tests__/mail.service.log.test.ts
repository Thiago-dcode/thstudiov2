jest.mock('../../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn() }));

import { MailService, Mailable } from '../mail.service';
import type { EmailDriver } from '../email-drivers/email-driver';

class TestMail extends Mailable {
  async envelope() {
    return { from: 'a@x.test', to: 'b@x.test', subject: 'hi' } as never;
  }
  async content() {
    return { text: 'hello' } as never;
  }
}

const setup = () => {
  const add = jest.fn().mockResolvedValue({ id: 'j1' });
  const queue = { add, name: 'mail' };
  const service = new MailService({} as EmailDriver, queue as never);
  return { service, add };
};

describe('MailService trace propagation', () => {
  it('AC-19: sendAsync(m, undefined, { id: "R" }) enqueues with {"v":1,"id":"R"} as trace metadata', async () => {
    const { service, add } = setup();
    await service.sendAsync(new TestMail(), undefined, { id: 'R' });
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][2].telemetry.metadata).toBe('{"v":1,"id":"R"}');
  });

  it('AC-19: sendBatchAsync(ms, undefined, { id: "R" }) enqueues with {"v":1,"id":"R"} as trace metadata', async () => {
    const { service, add } = setup();
    await service.sendBatchAsync([new TestMail(), new TestMail()], undefined, { id: 'R' });
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][2].telemetry.metadata).toBe('{"v":1,"id":"R"}');
  });

  it('AC-19: without a log config the job carries no trace', async () => {
    const { service, add } = setup();
    await service.sendAsync(new TestMail());
    expect(add.mock.calls[0][2].telemetry).toBeUndefined();
  });

  it('AC-19: an explicit jobOptions.telemetry is not overridden by the log id', async () => {
    const { service, add } = setup();
    await service.sendAsync(new TestMail(), { telemetry: { metadata: 'own' } } as never, { id: 'R' });
    expect(add.mock.calls[0][2].telemetry.metadata).toBe('own');
  });
});
