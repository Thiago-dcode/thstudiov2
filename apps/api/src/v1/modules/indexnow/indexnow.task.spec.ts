const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

jest.mock('./indexnow.service', () => ({ IndexNowService: class {} }));
jest.mock('src/common/utils/cron-lock', () => ({
  CRON_LOCK_TTL: { hourly: 1 },
  runCronExclusive: async (_name: string, _ttl: number, job: () => Promise<void>) => job(),
}));

import { logService } from '@repo/backend-lib/config/logging';
import type { LogService } from '@repo/backend-lib/services/log-service';
import { IndexNowTask } from './indexnow.task';

const build = (result: unknown | Error) => {
  jest.spyOn(logService, 'api').mockReturnValue(mockLog as unknown as LogService);
  const service = {
    submitChangedSince: result instanceof Error ? jest.fn().mockRejectedValue(result) : jest.fn().mockResolvedValue(result),
  };
  return new IndexNowTask(service as never);
};

describe('IndexNowTask logging', () => {
  beforeEach(() => Object.values(mockLog).forEach((fn) => fn.mockReset()));
  afterEach(() => jest.restoreAllMocks());

  it('AC-33: a 200 logs info "IndexNow submitted" with urls, http_status, warmed_images and duration_ms', async () => {
    const task = build({ status: 'submitted', urls: 12, httpStatus: 200, warmedImages: 3, durationMs: 250 });
    await task.submitRecentChanges();
    expect(mockLog.info).toHaveBeenCalledTimes(1);
    const [message, extra, fields] = mockLog.info.mock.calls[0];
    expect(message).toBe('IndexNow submitted');
    expect(extra).toEqual({ urls: 12, http_status: 200, warmed_images: 3, duration_ms: 250 });
    expect(fields).toEqual({ operation: 'submit' });
  });

  it('AC-33: a 202 is info too', async () => {
    const task = build({ status: 'submitted', urls: 1, httpStatus: 202, warmedImages: 0, durationMs: 5 });
    await task.submitRecentChanges();
    expect(mockLog.info).toHaveBeenCalledTimes(1);
    expect(mockLog.warn).not.toHaveBeenCalled();
  });

  it('AC-33: another status logs warn with the same fields', async () => {
    const task = build({ status: 'submitted', urls: 4, httpStatus: 429, warmedImages: 0, durationMs: 90 });
    await task.submitRecentChanges();
    expect(mockLog.warn).toHaveBeenCalledTimes(1);
    expect(mockLog.warn.mock.calls[0][0]).toBe('IndexNow submitted');
    expect(mockLog.warn.mock.calls[0][1]).toMatchObject({ http_status: 429, duration_ms: 90 });
    expect(mockLog.info).not.toHaveBeenCalled();
  });

  it('AC-33: a skipped run writes no submission line', async () => {
    const task = build({ status: 'skipped' });
    await task.submitRecentChanges();
    for (const fn of Object.values(mockLog)) expect(fn).not.toHaveBeenCalled();
  });

  it('AC-33: a failure logs error with a constant message and the error text in fields', async () => {
    const task = build(new Error('network down'));
    await task.submitRecentChanges();
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    expect(mockLog.error.mock.calls[0][0]).toBe('IndexNow submission failed');
    expect(mockLog.error.mock.calls[0][1]).toEqual({ error_message: 'network down' });
  });
});
