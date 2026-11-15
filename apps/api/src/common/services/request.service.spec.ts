import { AsyncLocalStorage } from 'async_hooks';
import type { UserAuth } from '@repo/common-lib/types/auth';
import type { RequestStore } from '@repo/common-lib/types/request';
import { RequestService } from './request.service';

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

const build = () => new RequestService(new AsyncLocalStorage<RequestStore>());

const user = {
  id: 42,
  role: { id: 2, name: 'USER' },
  email: 'victim@example.com',
  token: 'user-token-secret',
} as unknown as UserAuth;

describe('RequestService log context', () => {
  it('AC-2: log is null outside a request store', () => {
    expect(build().log).toBeNull();
  });

  it('AC-2: run() initialises method to null and log has exactly the AC-1 keys in order', async () => {
    const svc = build();
    let log: ReturnType<() => typeof svc.log> = null;
    let method: string | null = 'unset';
    await svc.run(() => {
      method = svc.method;
      log = svc.log;
    });
    expect(method).toBeNull();
    expect(log).not.toBeNull();
    expect(Object.keys(log!)).toEqual(LOG_KEYS);
    expect(log!.id).toEqual(expect.any(String));
    expect(log!.method).toBeNull();
    expect(log!.user_id).toBeNull();
    expect(log!.user_role).toBeNull();
    expect(log!.unattributed_app_call).toBe(false);
  });

  it('AC-2: method getter/setter works inside a store', async () => {
    const svc = build();
    await svc.run(() => {
      svc.method = 'POST';
      expect(svc.method).toBe('POST');
      expect(svc.log!.method).toBe('POST');
    });
  });

  it('AC-2: returns a fresh plain object each time, not the store', async () => {
    const svc = build();
    await svc.run(() => {
      const a = svc.log!;
      const b = svc.log!;
      expect(a).not.toBe(b);
      a.path = 'mutated';
      expect(svc.log!.path).toBeNull();
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
      const log = svc.log!;
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
      svc.viewer = { id: 9, role: { id: 3, name: 'ADMIN' } } as unknown as UserAuth;
      expect(svc.log!.user_id).toBe(9);
      expect(svc.log!.user_role).toBe('ADMIN');
      svc.user = user;
      expect(svc.log!.user_id).toBe(42);
    });
  });

  it('AC-3: logBinding returns live functions for id and request', async () => {
    const svc = build();
    const binding = svc.logBinding();
    expect(Object.keys(binding).sort()).toEqual(['id', 'request']);
    expect(typeof binding.id).toBe('function');
    expect(typeof binding.request).toBe('function');
    const idFn = binding.id as () => string | null;
    const reqFn = binding.request as () => unknown;
    expect(idFn()).toBeNull();
    expect(reqFn()).toBeNull();

    await svc.run(() => {
      expect(idFn()).toBe(svc.requestId);
      expect((reqFn() as { method: string | null }).method).toBeNull();
      svc.method = 'DELETE';
      svc.user = user;
      expect((reqFn() as { method: string; user_id: number }).method).toBe('DELETE');
      expect((reqFn() as { user_id: number }).user_id).toBe(42);
    });
  });

  it('AC-3: two concurrent requests see their own context through one binding', async () => {
    const svc = build();
    const binding = svc.logBinding();
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
