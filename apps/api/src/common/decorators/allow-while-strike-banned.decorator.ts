import { SetMetadata } from '@nestjs/common';

export const ALLOW_WHILE_STRIKE_BANNED_KEY = 'allowWhileStrikeBanned';

/**
 * Lets a mutating route through `UserStrikesGuard` while the caller serves a temporary strike ban.
 * Only for actions a ban must never block — e.g. requesting account deletion (GDPR erasure).
 */
export const AllowWhileStrikeBanned = () => SetMetadata(ALLOW_WHILE_STRIKE_BANNED_KEY, true);
