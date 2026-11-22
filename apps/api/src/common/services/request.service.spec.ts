import type { UserAuth } from '@repo/common-lib/types/auth';
import { RequestService } from './request.service';
import { currentRequestId, currentRequestLogContext, requestStorage } from './request-storage';

const LOG_KEYS = [
  'id',
  'method',
  'path',
  'ip_address',
  'user_agent',
  'user_id',
  'user_role',
  'language',
  'unattributed_app_call',
];

const build = () => new RequestService(requestStorage);

const user = {
  id: 42,
  role: { id: 2, name: 'USER' },
  email: 'victim@example.com',
  token: 'user-token-secret',
} as unknown as UserAuth;

describe('RequestService log context', () => {
  it('AC-2: log is null outside a request store', () => {
    expect(build().logContext).toBeNull();
  });

  it('AC-2: run() initialises method to null (no log context yet); once set, log has exactly the AC-1 keys in order', async () => {
    const svc = build();
    let log: ReturnType<() => typeof svc.logContext> = null;
    let before: ReturnType<() => typeof svc.logContext> = null;
    let method: string | null = 'unset';
    await svc.run(() => {
      method = svc.method;
      before = svc.logContext;
      svc.method = 'GET';
      log = svc.logContext;
    });
    expect(method).toBeNull();
    expect(before).toBeNull();
    expect(log).not.toBeNull();
    expect(Object.keys(log!)).toEqual(LOG_KEYS);
    expect(log!.id).toEqual(expect.any(String));
    expect(log!.method).toBe('GET');
    expect(log!.user_id).toBeNull();
    expect(log!.user_role).toBeNull();
    expect(log!.unattributed_app_call).toBe(false);
  });

  it('AC-2: method getter/setter works inside a store', async () => {
    const svc = build();
    await svc.run(() => {
      svc.method = 'POST';
      expect(svc.method).toBe('POST');
      expect(svc.logContext!.method).toBe('POST');
    });
  });

  it('AC-2: returns a fresh plain object each time, not the store', async () => {
    const svc = build();
    await svc.run(() => {
      svc.method = 'GET';
      const a = svc.logContext!;
      const b = svc.logContext!;
      expect(a).not.toBe(b);
      a.path = 'mutated';
      expect(svc.logContext!.path).toBeNull();
      expect(svc.path).toBeNull();
    });
  });

  it('AC-2: never leaks bearer_token, token, email or password', async () => {
    const svc = build();
    await svc.run(() => {
      svc.bearer_token = 'bearer-secret';
      svc.user = user;
      svc.path = '/v1/x';
      svc.method = 'GET';
      const log = svc.logContext!;
      expect(log.user_id).toBe(42);
      expect(log.user_role).toBe('USER');
      const text = JSON.stringify(log);
      expect(text).not.toContain('bearer-secret');
      expect(text).not.toContain('user-token-secret');
      expect(text).not.toContain('victim@example.com');
      expect(text).not.toMatch(/bearer_token|"token"|email|password/);
      expect(Object.keys(log)).toEqual(LOG_KEYS);
    });
  });

  it('AC-2: user_id/user_role fall back to viewer when there is no user', async () => {
    const svc = build();
    await svc.run(() => {
      svc.method = 'GET';
      svc.viewer = { id: 9, role: { id: 3, name: 'ADMIN' } } as unknown as UserAuth;
      expect(svc.logContext!.user_id).toBe(9);
      expect(svc.logContext!.user_role).toBe('ADMIN');
      svc.user = user;
      expect(svc.logContext!.user_id).toBe(42);
    });
  });

  it('AC-3: currentRequestId/currentRequestLogContext read the live request', async () => {
    const svc = build();
    const idFn = currentRequestId;
    const reqFn = currentRequestLogContext as () => unknown;
    expect(idFn()).toBeNull();
    expect(reqFn()).toBeNull();

    await svc.run(() => {
      expect(idFn()).toBe(svc.requestId);
      expect(reqFn()).toBeNull();
      svc.method = 'DELETE';
      svc.user = user;
      expect((reqFn() as { method: string; user_id: number }).method).toBe('DELETE');
      expect((reqFn() as { user_id: number }).user_id).toBe(42);
    });
  });

  it('AC-3: two concurrent requests see their own context through the shared functions', async () => {
    const svc = build();
    const binding = { request: currentRequestLogContext };
    const seen: Record<string, string | null> = {};
    const one = (name: string, delay: number) =>
      svc.run(() => {
        svc.method = name;
        setTimeout(() => {
          seen[name] = (binding.request as () => { method: string | null })().method;
        }, delay);
      });
    await Promise.all([one('GET', 20), one('POST', 5)]);
    await new Promise((r) => setTimeout(r, 50));
    expect(seen).toEqual({ GET: 'GET', POST: 'POST' });
  });
});
