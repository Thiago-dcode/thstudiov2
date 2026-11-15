import { AsyncLocalStorage } from 'async_hooks';
import { FactoryLogService, getLogContext } from '@repo/backend-lib/services/log-service';
import type { RequestStore } from '@repo/common-lib/types/request';
import { RequestService } from './request.service';

describe('RequestService log context', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-7: inside run, a logger built without logBinding carries the request id and request object', async () => {
    const service = new RequestService(new AsyncLocalStorage<RequestStore>());
    const logger = FactoryLogService.createLogService('console', { channel: 'users' });
    const lines: any[] = [];
    jest.spyOn(console, 'log').mockImplementation((line: unknown) => { lines.push(JSON.parse(String(line))); });
    let requestId: string | null = null;
    await service.run(() => {
      service.method = 'POST';
      requestId = service.requestId;
      logger.info('inside');
    });
    logger.info('outside');
    expect(lines[0].id).toBe(requestId);
    expect(lines[0].request).toMatchObject({ id: requestId, method: 'POST' });
    expect(lines[1].id).toBeNull();
    expect('request' in lines[1]).toBe(false);
  });

  it('AC-7: the log context id is the request id and the request resolver is live', async () => {
    const service = new RequestService(new AsyncLocalStorage<RequestStore>());
    await service.run(() => {
      const context = getLogContext()!;
      expect(context.id).toBe(service.requestId);
      service.method = 'DELETE';
      expect(context.request!()!.method).toBe('DELETE');
    });
  });

  it('AC-7: concurrent requests keep their own ids on one shared logger', async () => {
    const service = new RequestService(new AsyncLocalStorage<RequestStore>());
    const logger = FactoryLogService.createLogService('console', { channel: 'users' });
    const lines: any[] = [];
    jest.spyOn(console, 'log').mockImplementation((line: unknown) => { lines.push(JSON.parse(String(line))); });
    const seen: Record<string, string | null> = {};
    const one = (name: string, delay: number) =>
      service.run(async () => {
        seen[name] = service.requestId;
        await new Promise((r) => setTimeout(r, delay));
        logger.info(name);
      });
    await Promise.all([one('slow', 20), one('fast', 5)]);
    await new Promise((r) => setTimeout(r, 40));
    for (const line of lines) expect(line.id).toBe(seen[line.message]);
    expect(seen.slow).not.toBe(seen.fast);
  });
});
