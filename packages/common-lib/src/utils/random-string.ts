import { randomInt } from 'node:crypto';

const CHARACTERS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Cryptographically secure random string.
 *
 * Uses `crypto.randomInt` rather than `Math.random()`: this backs 2FA codes and
 * password-recovery values, and `Math.random()` is a non-CSPRNG whose internal state
 * can be recovered from a handful of observed outputs — which would make a second
 * factor predictable.
 *
 * `randomInt` is rejection-sampled internally, so the distribution stays uniform.
 */
export const randomStr = (length: number) => {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += CHARACTERS.charAt(randomInt(CHARACTERS.length));
    }
    return result.trim();
}
