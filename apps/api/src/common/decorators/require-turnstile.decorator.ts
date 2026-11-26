import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { TurnstileAction } from '@repo/common-lib/constants/turnstile';
import { TURNSTILE_ACTION_KEY, TurnstileGuard } from 'src/common/guards/turnstile.guard';

// The key lives next to the guard (which reads it) to avoid an import cycle.
export { TURNSTILE_ACTION_KEY };

/** Requires a valid Cloudflare Turnstile token for `action` in the body's `turnstile_token`. */
export const RequireTurnstile = (action: TurnstileAction) =>
  applyDecorators(SetMetadata(TURNSTILE_ACTION_KEY, action), UseGuards(TurnstileGuard));
