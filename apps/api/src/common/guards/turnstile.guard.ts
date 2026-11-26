import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TURNSTILE_TOKEN_FIELD, TurnstileAction } from '@repo/common-lib/constants/turnstile';
import { Request } from 'express';
import { TurnstileService } from 'src/common/services/turnstile.service';

/** Metadata key holding the route's Turnstile action (set by `@RequireTurnstile`). */
export const TURNSTILE_ACTION_KEY = 'turnstileAction';

/**
 * Requires a valid Cloudflare Turnstile token in the request body before the handler runs. Apply
 * it with `@RequireTurnstile(action)`, never directly. Route guards run after the global guards
 * (throttler, auth, strikes) and before the ValidationPipe, so the raw body is read here and DTO
 * validators (e.g. the `ModelNotExist` email check) are unreachable without a valid token.
 * Logs nothing: `TurnstileService` owns the lines.
 */
@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly turnstileService: TurnstileService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<TurnstileAction | undefined>(TURNSTILE_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) {
      // A programming bug (the guard used without `@RequireTurnstile`): a 500 is correct.
      throw new Error('TurnstileGuard requires a Turnstile action (use @RequireTurnstile)');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as Record<string, unknown> | undefined;
    await this.turnstileService.verify(body?.[TURNSTILE_TOKEN_FIELD], action);
    return true;
  }
}
