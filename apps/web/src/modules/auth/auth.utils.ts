import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/limits";

/** True while the user is still inside the get-started funnel (not finished, not skipped). */
export const isOnboardingPending = (funnelStep: number | null | undefined) =>
  typeof funnelStep === "number" &&
  funnelStep >= 1 &&
  funnelStep <= FUNNEL_LAST_STEP;

/**
 * Where a signed-in user lands when nothing else asked for a destination. Someone who hasn't
 * finished (or skipped) onboarding resumes it at their step instead of meeting an empty atelier.
 * Client-safe: used by the login, 2FA and register forms.
 */
export const getHomePath = (funnelStep: number | null | undefined) =>
  isOnboardingPending(funnelStep) ? "/get-started" : "/atelier";
