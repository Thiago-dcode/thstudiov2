jest.mock('../critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import { logBuffer, type LogEntry } from '../../config/logging';
import { isFinalAttempt as isFinalFromIndex } from '../index';
import { isFinalAttempt, logPermanentJobFailure, runJobWithLogs } from '../job-trace';

const job = (over: Record<string, unknown> = {}): any => ({
  id: '1',
  name: 'n',
  queueName: 'q',
  attemptsMade: 0,
  opts: { attempts: 1, telemetry: { metadata: JSON.stringify({ v: 1, id: 'R' }) } },
  ...over,
});

describe('AC-5: runJobWithLogs / logPermanentJobFailure never flush the process buffer', () => {
  let added: LogEntry[];
  let flush: jest.SpyInstance;

  beforeEach(() => {
    added = [];
    jest.spyOn(logBuffer, 'add').mockImplementation((_logContext, entry) => void added.push(entry));
    flush = jest.spyOn(logBuffer, 'flush');
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-5: a successful run, a failed run and a permanent failure leave flush at 0 calls, and the lines are still added', async () => {
    await runJobWithLogs(job(), async () => 'ok', { log: { service: 'worker' } });
    await expect(
      runJobWithLogs(job(), async () => {
        throw new Error('bad');
      }),
    ).rejects.toThrow('bad');
    await logPermanentJobFailure(job({ attemptsMade: 1 }), new Error('bad'), undefined, { service: 'worker' });
    await logPermanentJobFailure(undefined as never, new Error('no job'));

    expect(flush).not.toHaveBeenCalled();
    const messages = added.map((e) => e.message);
    expect(messages).toEqual(expect.arrayContaining(['Job started', 'Job completed', 'Job failed permanently']));
    expect(added.length).toBeGreaterThanOrEqual(5);
  });

  it('AC-5: with lifecycle off the handler still runs and nothing is flushed', async () => {
    await runJobWithLogs(job(), async () => 1, { lifecycle: false });
    expect(flush).not.toHaveBeenCalled();
    expect(added).toEqual([]);
  });
});

describe('AC-21: isFinalAttempt', () => {
  it.each([
    [0, 1, true],
    [0, 3, false],
    [1, 3, false],
    [2, 3, true],
    [5, 3, true],
    [0, 0, true],
    [0, undefined, true],
    [1, undefined, true],
  ])('attemptsMade %s with attempts %s gives %s', (attemptsMade, attempts, expected) => {
    expect(isFinalAttempt({ attemptsMade, opts: { attempts } } as never)).toBe(expected);
  });

  it('AC-21: tolerates missing opts and attemptsMade', () => {
    expect(isFinalAttempt({} as never)).toBe(true);
  });

  it('AC-21: is exported from the utils index and is the same function', () => {
    expect(isFinalFromIndex).toBe(isFinalAttempt);
  });
});
