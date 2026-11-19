jest.mock('../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import type { LogEntry } from '../../services/log-service/types';
import { jobTraceId } from '../../utils/job-trace';
import { emailCritical, getLogProcessService, logBuffer, logConfig, logService, setLogProcessService } from '../logging';

let added: LogEntry[];
beforeEach(() => {
  added = [];
  jest.spyOn(logBuffer, 'add').mockImplementation((entry) => void added.push(entry));
});
afterEach(() => jest.restoreAllMocks());

// One file, one process-service global: `lib` tests are ordered (unknown first, then set-once).
describe('AC-29: logService factories', () => {
  it.each(['api', 'worker', 'dbcli', 'web'] as const)('AC-29: logService.%s builds on the process logBuffer with its service and config defaults', (service) => {
    const logger = logService[service]();
    logger.info('hello');
    expect(logBuffer.add).toHaveBeenCalledTimes(1);
    expect(added[0]).toMatchObject({ service, channel: logConfig[service].channel, message: 'hello' });
  });

  it.each(['api', 'worker', 'dbcli', 'web'] as const)('AC-29: logService.%s applies overrides (channel, id, name, request) and keeps its service', (service) => {
    const request = { id: 'r', method: 'GET' } as never;
    logService[service]({ channel: 'custom', id: 'ID-1', name: 'op-1', request }).info('x');
    expect(added[0]).toMatchObject({ service, channel: 'custom', id: 'ID-1', operation: 'op-1', request });
  });

  it('AC-29: overrides can be functions that are read per line', () => {
    let current: string | null = 'A';
    const logger = logService.api({ id: () => current });
    logger.info('1');
    current = 'B';
    logger.info('2');
    expect(added.map((e) => e.id)).toEqual(['A', 'B']);
  });

  it('AC-29: each call returns a new logger (no shared builder state), and overrides do not leak between them', () => {
    const a = logService.worker({ channel: 'one' });
    const b = logService.worker();
    expect(a).not.toBe(b);
    b.info('b');
    expect(added[0].channel).toBe(logConfig.worker.channel);
  });

  it('AC-29: the service callback (critical mail) is carried; an override callback wins', async () => {
    const callback = jest.fn();
    expect(logConfig.api.callback).toBe(emailCritical);
    logService.api({ callback }).info('x');
    await logBuffer.settle();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('AC-29: logService.lib lines fall back to "unknown" before an entrypoint sets the process service', () => {
    expect(getLogProcessService()).toBeNull();
    logService.lib({ channel: 'ai' }).info('lib line');
    expect(added[0]).toMatchObject({ service: 'unknown', channel: 'ai' });
  });

  it('AC-29: logService.lib lines take the process service once it is set, also for loggers built earlier', () => {
    const early = logService.lib({ channel: 'ai' });
    setLogProcessService('worker');
    early.info('early');
    logService.lib().info('late');
    expect(added.map((e) => e.service)).toEqual(['worker', 'worker']);
    // the lib factory never touches api/web lines
    logService.api().info('api');
    expect(added[2].service).toBe('api');
  });

  it('AC-29: logService.lib carries the critical-mail callback', () => {
    const cb = jest.fn();
    logService.lib({ callback: cb }).info('x');
    expect(added).toHaveLength(1);
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
    logService.worker({ channel: 'media', id: jobTraceId(job(JSON.stringify({ v: 1, id: 'J' }))) }).info('x');
    expect(added[0]).toMatchObject({ service: 'worker', channel: 'media', id: 'J' });
  });
});
