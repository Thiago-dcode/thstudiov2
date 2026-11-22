import { AsyncLocalStorage } from 'node:async_hooks';
import type { WebLogContext } from '@repo/common-lib/types/log';
import { logBuffer, logService, type LogEntry } from '../logging';

// apps/web has no test runner and its logger is `server-only`, so it cannot be imported here. This
// builds the logger the way apps/web/src/lib/logging/logger.ts does (an AsyncLocalStorage store read
// through `id` and `globalContext` functions, a channel in defaultOptions; logging-contract.test.ts
// pins that the web file keeps this shape) and proves what AC-21 needs from the backend-lib side:
// one shared logger, concurrent runs, no mixing of ids or contexts.

const store = new AsyncLocalStorage<{ traceId: string; context: WebLogContext }>();
const webLogger = logService.web({
  id: () => store.getStore()?.traceId ?? null,
  globalContext: () => store.getStore()?.context,
  defaultOptions: { channel: 'web' },
});
const withLogTrace = <T>(fn: () => Promise<T>, context: WebLogContext, traceId: string) =>
  store.run({ traceId, context }, fn);

const ROUTE: WebLogContext = { kind: 'route', method: 'GET', route: '/api/oauth2/[provider]/callback' };
const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('web logger isolation (AC-21)', () => {
  let added: LogEntry[];
  beforeEach(() => {
    added = [];
    jest.spyOn(logBuffer, 'add').mockImplementation((_logContext, entry) => void added.push(entry));
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-21: inside a run every line has service web, channel web, the call operation, the run id and the context as request', async () => {
    await withLogTrace(async () => {
      webLogger.warn('OAuth callback rejected', { reason: 'unknown-provider', operation: 'oauth-callback', status_code: 400 });
      await tick(1);
      webLogger.info('after an await', { operation: 'oauth-callback' });
    }, ROUTE, 'RUN-1');

    expect(added).toHaveLength(2);
    for (const entry of added) {
      expect(entry).toMatchObject({ service: 'web', channel: 'web', operation: 'oauth-callback', id: 'RUN-1', request: ROUTE });
    }
    // status_code is top level only
    expect(added[0].status_code).toBe(400);
    expect(added[0].extraInfo).toEqual({ reason: 'unknown-provider' });
  });

  it('AC-21: outside a run a line has id "" and no request', () => {
    webLogger.info('outside', { operation: 'oauth-initiate' });
    expect(added[0]).toMatchObject({ service: 'web', channel: 'web', id: '' });
    expect(added[0]).not.toHaveProperty('request');
  });

  it('AC-21: two overlapping runs on the one logger keep their own id and context', async () => {
    const action: WebLogContext = { kind: 'action' };
    await Promise.all([
      withLogTrace(async () => {
        webLogger.info('a1');
        await tick(10);
        webLogger.info('a2');
      }, ROUTE, 'RUN-A'),
      withLogTrace(async () => {
        await tick(3);
        webLogger.info('b1');
        await tick(15);
        webLogger.info('b2');
      }, action, 'RUN-B'),
    ]);

    const by = (message: string) => added.find((e) => e.message === message)!;
    for (const message of ['a1', 'a2']) expect(by(message)).toMatchObject({ id: 'RUN-A', request: ROUTE });
    for (const message of ['b1', 'b2']) expect(by(message)).toMatchObject({ id: 'RUN-B', request: action });
    expect(added.map((e) => e.message)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });

  it('AC-21: a run that ends leaves nothing behind for the next line', async () => {
    await withLogTrace(async () => webLogger.info('in'), ROUTE, 'RUN-C');
    webLogger.info('out');
    expect(added[1]).toMatchObject({ message: 'out', id: '' });
    expect(added[1]).not.toHaveProperty('request');
  });

  it('AC-21: the request is the allow-listed context only; a secret that a caller puts in extraInfo stays redacted there', async () => {
    await withLogTrace(async () => webLogger.error('x', { token: 'secret-token', operation: 'oauth-callback' }), ROUTE, 'RUN-D');
    expect(JSON.stringify(added)).not.toContain('secret-token');
    expect(Object.keys(added[0].request as object).sort()).toEqual(['kind', 'method', 'route']);
  });

  it('AC-14: a web logger rejects a job context at compile time', () => {
    // @ts-expect-error the web globalContext is a WebLogContext, not a JobLogContext
    logService.web({ globalContext: () => ({ queue: 'q' }) });
    // @ts-expect-error a worker logger takes a JobLogContext, not an http path
    logService.worker({ globalContext: () => ({ path: '/x' }) });
  });
});
