const createMailJob = jest.fn();

jest.mock('@repo/common-lib/config', () => ({
  config: () => ({ app: { sendErrorEmails: true, errorEmailThrottleMinutes: 0, url: 'https://example.test' } }),
}));
jest.mock('./queue-helper', () => ({ QueueHelper: { createMailJob } }));

import { callback500ErrorMail } from './callback-500-error-mail';

describe('callback500ErrorMail', () => {
  beforeEach(() => {
    createMailJob.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it.each(['info', 'warn', 'debug', 'success'] as const)('never emails a %s line', async (level) => {
    await callback500ErrorMail(level, 'Successfully moderated content');
    expect(createMailJob).not.toHaveBeenCalled();
  });

  it('emails an error', async () => {
    await callback500ErrorMail('error', 'Failed to moderate content', { path: '/api/v1/users/3' });
    expect(createMailJob).toHaveBeenCalledTimes(1);
  });
});
