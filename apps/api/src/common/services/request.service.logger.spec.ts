import { logService } from '@repo/backend-lib/config/logging';
import { enqueueJob, readJobTrace } from '@repo/backend-lib/utils/job-trace';
import { consoleLogger } from 'src/common/testing/console-logger';
import { RequestService, apiLogger, apiTraceCarrier } from './request.service';
import { requestStorage, runWithTraceId } from './request-storage';

type Store = Parameters<typeof requestStorage.run>[0];

const store = (requestId: string, method: string | null = null): Store => ({
  requestId,
  user: null,
  language: null,
  user_agent: null,
  method,
  ip_address: null,
  path: method ? '/x' : null,
  pagination: null,
  unattributed_app_call: false,
  bearer_token: null,
});

describe('RequestService.log / traceCarrier / apiLogger / apiTraceCarrier', () => {
  let lines: any[];
  const service = new RequestService(requestStorage);

  beforeEach(() => {
    lines = [];
    // Real boundary: the process log buffer. Route every logger to an immediate console one.
    jest.spyOn(logService, 'api').mockImplementation((cfg = {}) => consoleLogger(cfg));
    jest.spyOn(logService, 'lib').mockImplementation((cfg = {}) => consoleLogger(cfg));
    for (const fn of ['log', 'warn', 'error', 'debug'] as const) {
      jest.spyOn(console, fn).mockImplementation((line: unknown) => {
        try {
          lines.push(JSON.parse(String(line)));
        } catch {
          /* not a log line */
        }
      });
    }
  });
  afterEach(() => jest.restoreAllMocks());

  describe('log()', () => {
    it('AC-6: writes service api, the channel, extraInfo and the request id inside a request, with request context', () => {
      const log = service.log('users');
      requestStorage.run(store('REQ-1', 'GET'), () => log.info('X', { user_id: 1 }));
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        service: 'api',
        channel: 'users',
        id: 'REQ-1',
        message: 'X',
        extraInfo: { user_id: 1 },
      });
      expect(lines[0].request).toMatchObject({ id: 'REQ-1', method: 'GET' });
    });

    it('AC-6: level stays uppercase', () => {
      const log = service.log('users');
      requestStorage.run(store('REQ-1', 'GET'), () => log.info('X'));
      expect(lines[0].level).toBe('INFO');
    });

    it('AC-6: outside an HTTP request there is no request key', () => {
      const log = service.log('users');
      log.info('outside');
      requestStorage.run(store('JOB-1', null), () => log.info('job'));
      expect('request' in lines[0]).toBe(false);
      expect('request' in lines[1]).toBe(false);
      expect(lines[1].id).toBe('JOB-1');
    });

    it('AC-6: one logger instance reads the id per line across different stores', () => {
      const log = service.log('users');
      requestStorage.run(store('A', 'GET'), () => log.info('a'));
      requestStorage.run(store('B', 'POST'), () => log.info('b'));
      expect(lines.map((l) => l.id)).toEqual(['A', 'B']);
      expect(lines[1].request.method).toBe('POST');
    });

    it('AC-6: concurrent stores on one logger keep their own ids', async () => {
      const log = service.log('users');
      const run = (id: string, delay: number) =>
        requestStorage.run(store(id, 'GET'), async () => {
          await new Promise((r) => setTimeout(r, delay));
          log.info(id);
        });
      await Promise.all([run('slow', 20), run('fast', 2)]);
      for (const line of lines) expect(line.id).toBe(line.message);
      expect(lines).toHaveLength(2);
    });

    it('AC-7: the default operation is on every line, and a call operation wins', () => {
      const log = service.log('media', { operation: 'create' });
      log.info('a');
      log.info('b', { operation: 'other' });
      expect(lines[0].operation).toBe('create');
      expect(lines[1].operation).toBe('other');
      expect(lines[0].channel).toBe('media');
    });

    it('AC-7: without a default or call operation, operation is null', () => {
      service.log('media').info('a');
      expect(lines[0].operation).toBeNull();
    });

    it('AC-8: traceId overrides the request id', () => {
      const log = service.log('webhooks', { traceId: 'T' });
      requestStorage.run(store('REQ-9', 'POST'), () => log.info('evt'));
      expect(lines[0].id).toBe('T');
    });

    it('AC-13: status_code and a string method are top level', () => {
      const log = service.log('api.access');
      log.info('x', { status_code: 404, method: 'password', other: 1 });
      expect(lines[0].status_code).toBe(404);
      expect(lines[0].method).toBe('password');
      expect(lines[0].extraInfo).toMatchObject({ other: 1 });
      expect(lines[0].extraInfo).not.toHaveProperty('status_code');
    });
  });

  describe('traceCarrier()', () => {
    it('AC-9: only service, id and globalContext keys', () => {
      const carrier = service.traceCarrier();
      expect(Object.keys(carrier).sort()).toEqual(['globalContext', 'id', 'service']);
      expect(carrier.service).toBe('api');
    });

    it('AC-9: id resolves when read, not when the carrier was built', () => {
      const carrier = service.traceCarrier();
      const read = () => (typeof carrier.id === 'function' ? carrier.id() : carrier.id);
      expect(read()).toBeNull();
      requestStorage.run(store('LATE', 'GET'), () => expect(read()).toBe('LATE'));
      requestStorage.run(store('LATER', 'GET'), () => expect(read()).toBe('LATER'));
    });

    it('AC-9: traceCarrier(T) resolves id to T', () => {
      const carrier = service.traceCarrier('T');
      const read = () => (typeof carrier.id === 'function' ? carrier.id() : carrier.id);
      requestStorage.run(store('REQ', 'GET'), () => expect(read()).toBe('T'));
    });

    it('AC-9: enqueueJob with the carrier adds the job with telemetry carrying the request id', async () => {
      const queue: any = { name: 'q', add: jest.fn().mockResolvedValue({ id: '1', opts: {} }) };
      const carrier = service.traceCarrier();
      await requestStorage.run(store('REQ-Q', 'GET'), () => enqueueJob(queue, 'x', {}, undefined, carrier));
      expect(queue.add).toHaveBeenCalledTimes(1);
      const opts = queue.add.mock.calls[0][2];
      expect(opts.telemetry).toBeDefined();
      expect(readJobTrace({ opts })).toEqual({ id: 'REQ-Q' });
    });

    it('AC-9: enqueueJob with traceCarrier(T) writes T into the job trace', async () => {
      const queue: any = { name: 'q', add: jest.fn().mockResolvedValue({ id: '1', opts: {} }) };
      await requestStorage.run(store('REQ-Q', 'GET'), () =>
        enqueueJob(queue, 'x', {}, undefined, service.traceCarrier('T')),
      );
      expect(readJobTrace({ opts: queue.add.mock.calls[0][2] })).toEqual({ id: 'T' });
    });
  });

  describe('apiLogger() / apiTraceCarrier()', () => {
    it('AC-10: behaves like service.log over the process storage', () => {
      const log = apiLogger('users', { operation: 'op' });
      requestStorage.run(store('R1', 'GET'), () => log.info('x', { user_id: 2 }));
      requestStorage.run(store('R2', 'GET'), () => log.info('y'));
      expect(lines[0]).toMatchObject({ service: 'api', channel: 'users', operation: 'op', id: 'R1', extraInfo: { user_id: 2 } });
      expect(lines[0].request).toMatchObject({ id: 'R1' });
      expect(lines[1].id).toBe('R2');
    });

    it('AC-10: traceId option wins over the request id', () => {
      const log = apiLogger('webhooks', { traceId: 'T' });
      requestStorage.run(store('R1', 'GET'), () => log.info('x'));
      expect(lines[0].id).toBe('T');
    });

    it('AC-10: inside runWithTraceId lines carry the job id and no request', () => {
      const log = apiLogger('system');
      runWithTraceId('J', () => log.info('job line'));
      expect(lines[0].id).toBe('J');
      expect('request' in lines[0]).toBe(false);
    });

    it('AC-10: apiTraceCarrier has the same shape and resolves lazily', () => {
      const carrier = apiTraceCarrier();
      expect(Object.keys(carrier).sort()).toEqual(['globalContext', 'id', 'service']);
      expect(carrier.service).toBe('api');
      const read = () => (typeof carrier.id === 'function' ? carrier.id() : carrier.id);
      runWithTraceId('J', () => expect(read()).toBe('J'));
      expect((apiTraceCarrier('T').id as unknown)).toBe('T');
    });

    it('AC-10: apiTraceCarrier inside runWithTraceId feeds enqueueJob', async () => {
      const queue: any = { name: 'q', add: jest.fn().mockResolvedValue({ id: '1', opts: {} }) };
      const carrier = apiTraceCarrier();
      await runWithTraceId('J', () => enqueueJob(queue, 'x', {}, undefined, carrier));
      expect(readJobTrace({ opts: queue.add.mock.calls[0][2] })).toEqual({ id: 'J' });
    });
  });

  describe('logContext', () => {
    it('AC-11: logContext is null outside HTTP and the request context inside', () => {
      expect(service.logContext).toBeNull();
      requestStorage.run(store('R', 'GET'), () => expect(service.logContext).toMatchObject({ id: 'R', method: 'GET' }));
      requestStorage.run(store('J', null), () => expect(service.logContext).toBeNull());
    });
  });
});
