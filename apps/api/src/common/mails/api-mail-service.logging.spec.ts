const mockEmailLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('@repo/backend-lib/services/log-service', () => {
  // Patch the real class so backend-lib's internal imports see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/services/log-service');
  Object.assign(actual.FactoryLogService, { createLogService: () => mockEmailLog });
  return actual;
});
jest.mock('@repo/common-lib/config/utils', () => ({
  getConfigValue: () => ({ address: 'Street 1', social: { instagram: 'a11' }, url: 'https://app.test' }),
}));

import { ApiMailService } from './api-mail-service';

const EMAIL = 'victim@example.com';

class TestMail extends ApiMailService {
  protected async buildEnvelope() {
    return { from: 'noreply@a11studio.com', to: EMAIL, subject: 'SECRETSUBJECT welcome' };
  }
}

const build = (prefs: { canSend: boolean } | null) => {
  const views = { render: jest.fn().mockResolvedValue('<p>SECRETBODY</p>') };
  const emailPreferences = prefs
    ? { getDeliveryStatus: jest.fn().mockResolvedValue({ canSend: prefs.canSend, unsuscribeUrl: 'https://app.test/unsub?t=SECRETUNSUB' }) }
    : undefined;
  return new TestMail(views as never, emailPreferences as never, { viewPath: 'mails/welcome', emailType: 'WELCOME', data: {} } as never);
};

const dumped = () => JSON.stringify(Object.values(mockEmailLog).map((fn) => fn.mock.calls));

describe('ApiMailService logging', () => {
  beforeEach(() => Object.values(mockEmailLog).forEach((fn) => fn.mockReset()));

  it('AC-32: "Mail rendered" carries email_type and view only', async () => {
    await build({ canSend: true }).content();
    expect(mockEmailLog.info).toHaveBeenCalledTimes(1);
    const [message, extra] = mockEmailLog.info.mock.calls[0];
    expect(message).toBe('Mail rendered');
    expect(extra).toEqual({ email_type: 'WELCOME', view: 'mails/welcome' });
    expect(dumped()).not.toMatch(/@|SECRETSUBJECT|SECRETBODY|SECRETUNSUB|"email"/);
  });

  it('AC-32: without preferences it logs "Mail rendered (no preference check)" with the same two fields', async () => {
    await build(null).content();
    const [message, extra] = mockEmailLog.info.mock.calls[0];
    expect(message).toBe('Mail rendered (no preference check)');
    expect(extra).toEqual({ email_type: 'WELCOME', view: 'mails/welcome' });
    expect(dumped()).not.toMatch(/@|"email"/);
  });

  it('AC-32: a preference skip logs warn "Mail skipped by email preferences" and returns no content', async () => {
    await expect(build({ canSend: false }).content()).resolves.toEqual({});
    expect(mockEmailLog.warn).toHaveBeenCalledTimes(1);
    const [message, extra] = mockEmailLog.warn.mock.calls[0];
    expect(message).toBe('Mail skipped by email preferences');
    expect(extra).toEqual({ email_type: 'WELCOME', view: 'mails/welcome' });
    expect(dumped()).not.toMatch(/@|"email"/);
  });
});
