import { consoleLogger } from 'src/common/testing/console-logger';
import { RequestService } from './request.service';
import { currentRequestId, requestStorage } from './request-storage';

describe('RequestService log context', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-7: inside run, an api logger carries the request id and request object; outside, neither', async () => {
    const service = new RequestService(requestStorage);
    const logger = consoleLogger({ defaultOptions: { channel: 'users' } });
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
    expect(lines[1].id).toBe(''); // buildLogEntry writes '' when there is no trace id
    expect('request' in lines[1]).toBe(false);
  });

  it('AC-7: the store id is the request id and the request context is live', async () => {
    const service = new RequestService(requestStorage);
    await service.run(() => {
      expect(currentRequestId()).toBe(service.requestId);
      service.method = 'DELETE';
      expect(service.logContext!.method).toBe('DELETE');
    });
  });

  it('AC-7: concurrent requests keep their own ids on one shared logger', async () => {
    const service = new RequestService(requestStorage);
    const logger = consoleLogger({ defaultOptions: { channel: 'users' } });
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

  it('routes warn, error and critical lines to console.warn / console.error, others to console.log', () => {
    const logger = consoleLogger({ defaultOptions: { channel: 'users' } });
    const out = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.critical('c');
    expect(out).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(warn.mock.calls[0][0]))).toMatchObject({ level: 'WARN', message: 'w' });
  });
});
