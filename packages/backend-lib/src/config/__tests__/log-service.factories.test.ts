jest.mock('../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import type { LogContext } from '../../services/log-service/types';
import { jobTraceId } from '../../utils/job-trace';
import { criticalAlertMail } from '../../utils/critical-alert-mail';
import { getLogProcessService, logBuffer, logService, setLogProcessService, type LogEntry } from '../logging';

let added: LogEntry[];
let contexts: LogContext[];
beforeEach(() => {
  added = [];
  contexts = [];
  jest.spyOn(logBuffer, 'add').mockImplementation((logContext, entry) => {
    contexts.push(logContext);
    added.push(entry);
  });
  (criticalAlertMail as jest.Mock).mockClear();
});
afterEach(() => jest.restoreAllMocks());

const SERVICES = ['api', 'worker', 'dbcli', 'web'] as const;

// One file, one process-service global: `lib` tests are ordered (unknown first, then set-once).
describe('AC-29: logService factories', () => {
  it.each(SERVICES)('AC-29: logService.%s builds on the process logBuffer with its own service and channel system when none is set', (service) => {
    const logger = logService[service]();
    logger.info('hello');
    expect(logBuffer.add).toHaveBeenCalledTimes(1);
    expect(contexts[0].service).toBe(service);
    expect(added[0]).toMatchObject({ service, channel: 'system', operation: null, message: 'hello', level: 'INFO' });
    expect('request' in added[0]).toBe(false);
  });

  it.each(SERVICES)('AC-29: logService.%s applies overrides (id, defaultOptions, globalContext) and keeps its service', (service) => {
    const request = { id: 'r', method: 'GET' } as never;
    logService[service]({ id: 'ID-1', defaultOptions: { channel: 'media', operation: 'op-1' }, globalContext: () => request }).info('x');
    expect(added[0]).toMatchObject({ service, channel: 'media', id: 'ID-1', operation: 'op-1', request });
  });

  it.each(SERVICES)('AC-29: logService.%s: the call options win over defaultOptions, and the rest is extraInfo', (service) => {
    logService[service]({ defaultOptions: { channel: 'media', operation: 'create' } }).info('x', { operation: 'call', status_code: 404, media_id: 3 });
    expect(added[0]).toMatchObject({ channel: 'media', operation: 'call', status_code: 404, extraInfo: { media_id: 3 } });
  });

  it('AC-29: overrides can be functions that are read per line', () => {
    let current: string | null = 'A';
    const logger = logService.api({ id: () => current });
    logger.info('1');
    current = 'B';
    logger.info('2');
    expect(added.map((e) => e.id)).toEqual(['A', 'B']);
  });

  it('AC-29: a line without a trace id is written with id "" (not null)', () => {
    logService.api().info('x');
    expect(added[0].id).toBe('');
  });

  it('AC-29: each call returns a new logger (no shared builder state), and overrides do not leak between them', () => {
    const a = logService.worker({ defaultOptions: { channel: 'media' } });
    const b = logService.worker();
    expect(a).not.toBe(b);
    b.info('b');
    a.info('a');
    expect(added.map((e) => e.channel)).toEqual(['system', 'media']);
  });

  it('AC-29: a factory takes no service override (compile-time)', () => {
    // @ts-expect-error `service` is the factory's, not an override
    expect(() => logService.worker({ service: 'worker' })).not.toThrow();
  });

  it('AC-29: each service keeps its own globalContext type (AC-14)', () => {
    // @ts-expect-error a worker's request is the job context, not an HTTP request
    logService.worker({ globalContext: () => ({ path: '/x' }) });
    // @ts-expect-error a web request is an action or a route, not a job
    logService.web({ globalContext: () => ({ queue: 'q' }) });
    expect(() => logService.worker({ globalContext: () => ({ queue: 'q', job_name: 'n', job_id: '1', attempt: 1, max_attempts: 3 }) })).not.toThrow();
    expect(() => logService.web({ globalContext: () => ({ kind: 'action' }) })).not.toThrow();
    expect(() => logService.dbcli({ globalContext: () => ({ command: 'db:x' }) })).not.toThrow();
  });

  it('AC-29: the critical-mail callback is the factory default for every service: it mails critical lines only', async () => {
    for (const service of SERVICES) {
      logService[service]().info('fine');
      logService[service]().error('handled');
    }
    await logBuffer.settle();
    expect(criticalAlertMail).not.toHaveBeenCalled();

    for (const service of SERVICES) logService[service]({ defaultOptions: { channel: 'media' } }).critical('wake up');
    await logBuffer.settle();
    expect(criticalAlertMail).toHaveBeenCalledTimes(SERVICES.length);
    expect((criticalAlertMail as jest.Mock).mock.calls.map(([entry]) => entry.service)).toEqual([...SERVICES]);
    expect((criticalAlertMail as jest.Mock).mock.calls[0][0]).toMatchObject({ level: 'CRITICAL', channel: 'media', message: 'wake up' });
  });

  it('AC-29: an override callback replaces the critical mail', async () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    logService.api({ callback }).critical('x');
    await logBuffer.settle();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(criticalAlertMail).not.toHaveBeenCalled();
  });

  it('AC-29: logService.lib lines fall back to "unknown" before an entrypoint sets the process service', () => {
    expect(getLogProcessService()).toBeNull();
    logService.lib({ defaultOptions: { channel: 'ai' } }).info('lib line');
    expect(added[0]).toMatchObject({ service: 'unknown', channel: 'ai' });
    expect(contexts[0].service).toBe('unknown');
  });

  it('AC-29: logService.lib lines take the process service once it is set, also for loggers built earlier', () => {
    const early = logService.lib({ defaultOptions: { channel: 'ai' } });
    setLogProcessService('worker');
    early.info('early');
    logService.lib().info('late');
    expect(added.map((e) => e.service)).toEqual(['worker', 'worker']);
    expect(contexts.map((c) => c.service)).toEqual(['worker', 'worker']);
    // the lib factory never touches api/web lines
    logService.api().info('api');
    expect(added[2].service).toBe('api');
  });

  it('AC-29: logService.lib lines are never written under "lib" and have no request', () => {
    logService.lib({ defaultOptions: { channel: 'storage', operation: 'delete' } }).info('x');
    expect(added[0].service).not.toBe('lib');
    expect(added[0]).toMatchObject({ channel: 'storage', operation: 'delete' });
    expect('request' in added[0]).toBe(false);
  });

  it('AC-29: logService.lib takes no globalContext (AC-4)', () => {
    // @ts-expect-error a lib logger has no request
    logService.lib({ globalContext: () => ({ id: 'r' }) });
  });

  it('AC-29: logService.lib carries the critical-mail callback, with the process service in the mail', async () => {
    logService.lib({ defaultOptions: { channel: 'stripe' } }).critical('lib down');
    await logBuffer.settle();
    expect(criticalAlertMail).toHaveBeenCalledTimes(1);
    expect((criticalAlertMail as jest.Mock).mock.calls[0][0]).toMatchObject({ service: 'worker', channel: 'stripe', message: 'lib down' });
  });

  it('AC-29: a lib logger keeps an id of its own (the backup run id)', () => {
    logService.lib({ id: 'backup-123', defaultOptions: { channel: 'backup', operation: 'backup' } }).info('x');
    expect(added[0]).toMatchObject({ id: 'backup-123', channel: 'backup', operation: 'backup' });
  });
});

describe('AC-29: jobTraceId', () => {
  const job = (metadata: unknown) => ({ opts: { telemetry: { metadata } } }) as never;

  it('AC-29: returns the id of a valid carrier', () => {
    expect(jobTraceId(job(JSON.stringify({ v: 1, id: 'T' })))).toBe('T');
  });

  it('AC-29: returns null for a missing, malformed or wrong-version carrier, and for no job', () => {
    expect(jobTraceId({ opts: {} } as never)).toBeNull();
    expect(jobTraceId(job('not json'))).toBeNull();
    expect(jobTraceId(job(JSON.stringify({ v: 2, id: 'T' })))).toBeNull();
    expect(jobTraceId(job(JSON.stringify({ v: 1, id: 7 })))).toBeNull();
    expect(jobTraceId(job(42))).toBeNull();
    expect(jobTraceId(undefined)).toBeNull();
    expect(jobTraceId(null)).toBeNull();
  });

  it('AC-29: a worker job logger reads it: logService.worker({ id: jobTraceId(job) })', () => {
    logService.worker({ defaultOptions: { channel: 'media' }, id: jobTraceId(job(JSON.stringify({ v: 1, id: 'J' }))) }).info('x');
    expect(added[0]).toMatchObject({ service: 'worker', channel: 'media', id: 'J' });
  });
});
