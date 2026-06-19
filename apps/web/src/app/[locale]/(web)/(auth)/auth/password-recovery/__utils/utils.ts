import type { PasswordRecoveryAttempt } from "@/modules/auth/auth.types";

export const getTimeTillNextRecovery = (
 passwordRecovery: PasswordRecoveryAttempt | null,
) => {
 if (!passwordRecovery) return 0;
 const created_at = new Date(passwordRecovery.created_at).getTime();
 const now = new Date(new Date().toISOString()).getTime();
 const timeToWait = 1000 * 60 * 1.5;
 return timeToWait - (now - created_at);
};
