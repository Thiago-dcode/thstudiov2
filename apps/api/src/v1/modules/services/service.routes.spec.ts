jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import 'reflect-metadata';
import { PATH_METADATA, METHOD_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ServiceController } from './service.controller';

const proto = ServiceController.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;

/** Nest registers routes in prototype declaration order; express matches the first one. */
const routes = Object.getOwnPropertyNames(proto)
  .filter((name) => name !== 'constructor' && Reflect.getMetadata(PATH_METADATA, proto[name]) !== undefined)
  .map((name) => ({
    name,
    path: Reflect.getMetadata(PATH_METADATA, proto[name]) as string,
    method: Reflect.getMetadata(METHOD_METADATA, proto[name]) as RequestMethod,
  }));

describe('ServiceController routes', () => {
  it('AC-10: PATCH sort is declared above PATCH :id, so "sort" is never parsed as an id', () => {
    const patches = routes.filter((r) => r.method === RequestMethod.PATCH);
    const sort = patches.findIndex((r) => r.path === 'sort');
    const update = patches.findIndex((r) => r.path === ':id');
    expect(sort).toBeGreaterThanOrEqual(0);
    expect(update).toBeGreaterThanOrEqual(0);
    expect(sort).toBeLessThan(update);
  });

  it('AC-10: exactly two new PATCH routes; PATCH :id and the other routes are still there', () => {
    const patches = routes.filter((r) => r.method === RequestMethod.PATCH).map((r) => r.path);
    expect([...patches].sort()).toEqual([':id', ':id/status', 'sort']);
    expect(routes.filter((r) => r.method === RequestMethod.POST).map((r) => r.path)).toEqual(['/']);
    expect(routes.filter((r) => r.method === RequestMethod.GET).map((r) => r.path)).toEqual(['highlight-count']);
    expect(routes).toHaveLength(5);
  });

  it('AC-5: neither new route is @Public, and the whole controller has no public route', () => {
    for (const name of ['sort', 'updateStatus']) {
      expect(Reflect.getMetadata('isPublic', proto[name])).toBeFalsy();
    }
    expect(routes.filter((r) => Reflect.getMetadata('isPublic', proto[r.name]))).toHaveLength(0);
    expect(Reflect.getMetadata('isPublic', ServiceController)).toBeFalsy();
  });

  it('AC-14: the status route binds the id with ParseIntPipe and a blocked-resource pipe', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, ServiceController, 'updateStatus');
    const param = Object.values(args as Record<string, { pipes: unknown[] }>).find((a) => a.pipes?.length);
    expect(param).toBeDefined();
    expect(param!.pipes).toHaveLength(2);
  });

  it('AC-1: sort has no per-id pipe (owners may reorder blocked services)', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, ServiceController, 'sort');
    const withPipes = Object.values(args as Record<string, { pipes: unknown[] }>).filter((a) => a.pipes?.length);
    expect(withPipes).toHaveLength(0);
  });

  it('AC-10: sort and status are JSON routes (no FileInterceptor); :id stays multipart', () => {
    const interceptors = (name: string) => Reflect.getMetadata('__interceptors__', proto[name]);
    expect(interceptors('sort')).toBeUndefined();
    expect(interceptors('updateStatus')).toBeUndefined();
    expect(interceptors('update')).toHaveLength(1);
  });
});
