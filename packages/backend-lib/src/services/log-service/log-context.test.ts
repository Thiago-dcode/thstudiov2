import {
  addLogCorrelation,
  currentJobAttempt,
  getLogContext,
  runWithLogContext,
  setLogTraceId,
} from './log-context';

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('log context', () => {
  it('AC-1: getLogContext is undefined outside a run', () => {
    expect(getLogContext()).toBeUndefined();
  });

  it('AC-1: addLogCorrelation and setLogTraceId are no-ops outside and do not throw', () => {
    expect(() => addLogCorrelation({ user_id: 1 })).not.toThrow();
    expect(() => setLogTraceId('x')).not.toThrow();
    expect(getLogContext()).toBeUndefined();
  });

  it('AC-1: inside a run the context holds id and normalised correlation', () => {
    runWithLogContext({ id: 'T', correlation: { user_id: 5, queue: 'q' } }, () => {
      expect(getLogContext()).toMatchObject({ id: 'T', correlation: { user_id: 5, queue: 'q' } });
    });
  });

  it('AC-1: addLogCorrelation mutates only the current store and ignores null/undefined', () => {
    runWithLogContext({ id: 'A' }, () => {
      addLogCorrelation({ user_id: 9, stripe_customer_id: undefined, job_id: null as any });
      expect(getLogContext()!.correlation).toEqual({ user_id: 9 });
    });
  });

  it('AC-1: setLogTraceId re-points the current context', () => {
    runWithLogContext({ id: 'A' }, () => {
      setLogTraceId('B');
      expect(getLogContext()!.id).toBe('B');
    });
  });

  it('AC-1: two concurrent contexts never see each other', async () => {
    const seen: Record<string, unknown> = {};
    const run = (id: string, user: number, delay: number) =>
      runWithLogContext({ id, correlation: { user_id: user } }, async () => {
        await tick(delay);
        addLogCorrelation({ stripe_customer_id: `cus_${id}` });
        await tick(delay);
        seen[id] = { id: getLogContext()!.id, correlation: getLogContext()!.correlation };
      });
    await Promise.all([run('A', 1, 15), run('B', 2, 5)]);
    expect(seen.A).toEqual({ id: 'A', correlation: { user_id: 1, stripe_customer_id: 'cus_A' } });
    expect(seen.B).toEqual({ id: 'B', correlation: { user_id: 2, stripe_customer_id: 'cus_B' } });
  });

  it('AC-1: each run gets a fresh store (nested run does not leak back)', () => {
    runWithLogContext({ id: 'outer' }, () => {
      runWithLogContext({ id: 'inner', correlation: { user_id: 1 } }, () => undefined);
      expect(getLogContext()).toMatchObject({ id: 'outer', correlation: {} });
    });
  });

  it('AC-1: currentJobAttempt is null outside a job context', () => {
    expect(currentJobAttempt()).toBeNull();
    runWithLogContext({ id: 'req' }, () => expect(currentJobAttempt()).toBeNull());
  });

  it.each([
    [1, 3, false],
    [2, 3, false],
    [3, 3, true],
    [5, 5, true],
    [1, 1, true],
  ])('AC-1: attempt %i of %i gives is_final=%s', (attempt, max, final) => {
    runWithLogContext({ id: 'j', job: { attempt, max_attempts: max } }, () => {
      expect(currentJobAttempt()).toEqual({ attempt, max_attempts: max, is_final: final });
    });
  });
});
