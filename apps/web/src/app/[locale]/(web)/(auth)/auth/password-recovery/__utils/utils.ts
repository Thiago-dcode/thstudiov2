import type { PasswordRecoveryRequestStatus } from "@/modules/auth/auth.types";

export const getTimeTillNextRecovery = (
  passwordRecovery: PasswordRecoveryRequestStatus | null,
) => {
  if (!passwordRecovery) return 0;
  // Same clock the API's 90s cooldown uses (`updated_at` of the latest attempt).
  const updated_at = new Date(passwordRecovery.updated_at).getTime();
  const now = new Date(new Date().toISOString()).getTime();
  const timeToWait = 1000 * 60 * 1.5;
  return timeToWait - (now - updated_at);
};
