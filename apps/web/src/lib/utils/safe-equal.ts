import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for shared secrets. Both sides are hashed first so inputs of
 * different lengths still compare in constant time (`timingSafeEqual` throws on a length mismatch).
 */
export const safeEqual = (a: string, b: string): boolean =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
