jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import 'reflect-metadata';
import { PATH_METADATA, METHOD_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { CollectionController } from './collection.controller';

const proto = CollectionController.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;

/** Nest registers routes in prototype declaration order; express matches the first one. */
const routes = Object.getOwnPropertyNames(proto)
  .filter((name) => name !== 'constructor' && Reflect.getMetadata(PATH_METADATA, proto[name]) !== undefined)
  .map((name) => ({
    name,
    path: Reflect.getMetadata(PATH_METADATA, proto[name]) as string,
    method: Reflect.getMetadata(METHOD_METADATA, proto[name]) as RequestMethod,
  }));

describe('CollectionController routes', () => {
  it('AC-10: PATCH sort is declared above PATCH :id, so "sort" is never parsed as an id', () => {
    const patches = routes.filter((r) => r.method === RequestMethod.PATCH);
    const sort = patches.findIndex((r) => r.path === 'sort');
    const update = patches.findIndex((r) => r.path === ':id');
    expect(sort).toBeGreaterThanOrEqual(0);
    expect(update).toBeGreaterThanOrEqual(0);
    expect(sort).toBeLessThan(update);
  });

  it('AC-10: PATCH :id/status exists and PATCH :id is still there; exactly two new PATCH routes', () => {
    const patches = routes.filter((r) => r.method === RequestMethod.PATCH).map((r) => r.path);
    expect([...patches].sort()).toEqual([':id', ':id/status', 'sort']);
  });

  it('AC-5: neither new route is @Public (the default auth guard applies)', () => {
    for (const name of ['sort', 'updateStatus']) {
      expect(Reflect.getMetadata('isPublic', proto[name])).toBeFalsy();
    }
  });

  it('AC-14: the status route binds the id with ParseIntPipe and a blocked-resource pipe', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, CollectionController, 'updateStatus');
    const param = Object.values(args as Record<string, { pipes: unknown[] }>).find((a) => a.pipes?.length);
    expect(param).toBeDefined();
    expect(param!.pipes).toHaveLength(2);
  });

  it('AC-1: sort has no per-id pipe (owners may reorder blocked collections)', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, CollectionController, 'sort');
    const withPipes = Object.values(args as Record<string, { pipes: unknown[] }>).filter((a) => a.pipes?.length);
    expect(withPipes).toHaveLength(0);
  });

  it('AC-5: the public list stays the only @Public route', () => {
    const pub = routes.filter((r) => Reflect.getMetadata('isPublic', proto[r.name]));
    expect(pub.map((r) => r.name)).toEqual(['findAll']);
  });
});
