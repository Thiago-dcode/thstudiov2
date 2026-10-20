import { hasConsent } from "@/lib/consent/consent";

/** Funnel events sent to GA4. Keep the names stable: they are the report dimensions. */
export type AnalyticsEventName =
  | "signup_started"
  | "sign_up"
  | "portfolio_created"
  | "first_artwork_uploaded"
  | "waitlist_opened"
  | "waitlist_joined"
  | "artist_invite_clicked"
  | "artist_contact_opened"
  | "artist_contact_sent";

type AnalyticsParams = Record<string, string | number | boolean>;

/** Where on an artist's pages a visitor was invited to create a portfolio (`artist_invite_clicked`). */
export type InvitePlacement =
  | "header"
  | "end_of_content"
  | "contact_success"
  | "footer";

/**
 * Sends a GA4 event, but ONLY when gtag is running on this page (production origin with a measurement
 * ID, see `GoogleAnalyticsGate`) and the visitor has accepted analytics cookies. Otherwise it does
 * nothing. Never pass personal data (email, username, ids).
 * Browser-only: safe to call from any client handler.
 */
export const trackEvent = (
  name: AnalyticsEventName,
  params: AnalyticsParams = {},
) => {
  if (typeof window === "undefined" || !window.gtag) return;
  if (!hasConsent("analytics")) return;
  window.gtag("event", name, params);
};
