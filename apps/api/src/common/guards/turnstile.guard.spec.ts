import { ExecutionContext, ForbiddenException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import { TURNSTILE_ACTIONS } from '@repo/common-lib/constants/turnstile';
import { RequireTurnstile } from 'src/common/decorators/require-turnstile.decorator';
import { ApiException } from 'src/common/exceptions/api-exception';
import { TurnstileService } from 'src/common/services/turnstile.service';
import { TurnstileGuard } from './turnstile.guard';

class Routes {
  @RequireTurnstile(TURNSTILE_ACTIONS.SIGNUP)
  guarded() {}

  unguarded() {}
}

const contextFor = (handler: (...args: unknown[]) => unknown, body: unknown) =>
  ({
    getHandler: () => handler,
    getClass: () => Routes,
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  }) as unknown as ExecutionContext;

describe('TurnstileGuard', () => {
  const verify = jest.fn();
  const guard = new TurnstileGuard(new Reflector(), { verify } as unknown as TurnstileService);

  beforeEach(() => verify.mockReset());

  it('AC-1/AC-3: passes body.turnstile_token and the metadata action to verify, then lets the request through', async () => {
    verify.mockResolvedValue(undefined);
    const ctx = contextFor(Routes.prototype.guarded, { email: 'a@b.c', password: 'x', turnstile_token: 'TOKEN-1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith('TOKEN-1', 'signup');
  });

  it('AC-1: hands a missing token (and a missing body) to verify as undefined, never a default', async () => {
    verify.mockResolvedValue(undefined);
    await guard.canActivate(contextFor(Routes.prototype.guarded, { email: 'a@b.c' }));
    await guard.canActivate(contextFor(Routes.prototype.guarded, undefined));
    expect(verify.mock.calls).toEqual([
      [undefined, 'signup'],
      [undefined, 'signup'],
    ]);
  });

  it('AC-1: hands a non-string token through unchanged so verify can reject it', async () => {
    verify.mockResolvedValue(undefined);
    await guard.canActivate(contextFor(Routes.prototype.guarded, { turnstile_token: 42 }));
    expect(verify).toHaveBeenCalledWith(42, 'signup');
  });

  it('throws a plain Error (500) when the route has no Turnstile action metadata, without verifying', async () => {
    const err = await guard.canActivate(contextFor(Routes.prototype.unguarded, { turnstile_token: 'TOKEN-1' })).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(ForbiddenException);
    expect(err).not.toBeInstanceOf(ApiException);
    expect(verify).not.toHaveBeenCalled();
  });

  it.each([
    [API_ERRORS.TURNSTILE_FAILED, HttpStatus.FORBIDDEN],
    [API_ERRORS.TURNSTILE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE],
  ])('AC-1/AC-5: propagates the %s ApiException from verify', async (code, status) => {
    const thrown = new ApiException(code, 'x', status);
    verify.mockRejectedValue(thrown);
    await expect(guard.canActivate(contextFor(Routes.prototype.guarded, { turnstile_token: 'T' }))).rejects.toBe(thrown);
  });
});
