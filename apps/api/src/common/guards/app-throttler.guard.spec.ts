import { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { RequestService } from 'src/common/services/request.service';
import { AppThrottlerGuard } from './app-throttler.guard';

/**
 * `getTracker` decides which bucket a request is counted against, so a mistake here either
 * collapses every visitor into one shared limit (the bug this guard exists to fix) or lets a
 * caller pick their own bucket and evade limiting entirely.
 */
describe('AppThrottlerGuard.getTracker', () => {
  const options = [] as unknown as ThrottlerModuleOptions;
  const storage = {} as ThrottlerStorage;

  /** `RequestService.ip_address` is what `RequestMiddleware` already resolved for this request. */
  const trackerFor = async (
    resolvedIpAddress: string | null,
    req: Record<string, any>,
  ) => {
    const requestService = {
      ip_address: resolvedIpAddress,
    } as unknown as RequestService;
    const guard = new AppThrottlerGuard(
      options,
      storage,
      new Reflector(),
      requestService,
    );

    // getTracker is protected; the guard's own canActivate is what normally calls it.
    return (guard as unknown as {
      getTracker: (r: Record<string, any>) => Promise<string>;
    }).getTracker(req);
  };

  it('buckets by the end user when the middleware resolved a forwarded IP', async () => {
    await expect(trackerFor('203.0.113.7', { ip: '10.0.0.5' })).resolves.toBe(
      '203.0.113.7',
    );
  });

  it('gives two visitors behind the same web container separate buckets', async () => {
    const webContainer = { ip: '172.18.0.4' };
    const [first, second] = await Promise.all([
      trackerFor('203.0.113.7', webContainer),
      trackerFor('198.51.100.2', webContainer),
    ]);

    expect(first).not.toBe(second);
  });

  it('takes the original client from a comma-joined forwarded chain', async () => {
    await expect(
      trackerFor('203.0.113.7, 70.41.3.18, 150.172.238.178', { ip: '10.0.0.5' }),
    ).resolves.toBe('203.0.113.7');
  });

  it('falls back to req.ip when the caller is not trusted to forward an IP', async () => {
    // RequestMiddleware only copies the forwarded header for a valid APP_TOKEN; otherwise
    // ip_address is already req.ip, so an untrusted client cannot choose its own bucket.
    await expect(trackerFor('10.0.0.5', { ip: '10.0.0.5' })).resolves.toBe(
      '10.0.0.5',
    );
  });

  it("falls back to req.ip when the middleware wrote its '-' placeholder", async () => {
    await expect(trackerFor('-', { ip: '10.0.0.5' })).resolves.toBe('10.0.0.5');
  });

  it('never returns an empty key, which would bucket every such request together', async () => {
    await expect(trackerFor(null, {})).resolves.toBe('unknown');
    await expect(trackerFor('', {})).resolves.toBe('unknown');
    await expect(trackerFor('   ', {})).resolves.toBe('unknown');
  });
});
