jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import 'reflect-metadata';
import { PATH_METADATA, METHOD_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';

const proto = PortfolioController.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;

/** Nest registers routes in prototype declaration order; express matches the first one. */
const routes = Object.getOwnPropertyNames(proto)
  .filter((name) => name !== 'constructor' && Reflect.getMetadata(PATH_METADATA, proto[name]) !== undefined)
  .map((name) => ({
    name,
    path: Reflect.getMetadata(PATH_METADATA, proto[name]) as string,
    method: Reflect.getMetadata(METHOD_METADATA, proto[name]) as RequestMethod,
  }));

describe('PortfolioController routes', () => {
  it('AC-12: PATCH sort is declared above PATCH :id, so "sort" is never parsed as an id', () => {
    const patches = routes.filter((r) => r.method === RequestMethod.PATCH);
    const sort = patches.findIndex((r) => r.path === 'sort');
    const update = patches.findIndex((r) => r.path === ':id');
    expect(sort).toBeGreaterThanOrEqual(0);
    expect(update).toBeGreaterThanOrEqual(0);
    expect(sort).toBeLessThan(update);
  });

  it('AC-13: PATCH :id/status exists and PATCH :id is still there (AC-12)', () => {
    const patches = routes.filter((r) => r.method === RequestMethod.PATCH).map((r) => r.path);
    expect(patches).toEqual(expect.arrayContaining(['sort', ':id/status', ':id']));
  });

  it('AC-5: neither new route is @Public (the default auth guard applies)', () => {
    for (const name of ['sort', 'updateStatus']) {
      expect(Reflect.getMetadata('isPublic', proto[name])).toBeFalsy();
    }
  });

  it('AC-16: the status route binds the id with ParseIntPipe and a blocked-resource pipe', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, PortfolioController, 'updateStatus');
    const param = Object.values(args as Record<string, { pipes: unknown[] }>).find((a) => a.pipes?.length);
    expect(param).toBeDefined();
    expect(param!.pipes).toHaveLength(2);
  });

  it('AC-16: sort has no per-id pipe (owners may reorder blocked portfolios)', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, PortfolioController, 'sort');
    const withPipes = Object.values(args as Record<string, { pipes: unknown[] }>).filter((a) => a.pipes?.length);
    expect(withPipes).toHaveLength(0);
  });
});
