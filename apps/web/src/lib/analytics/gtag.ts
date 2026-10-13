/**
 * Our own thin gtag bootstrap (instead of `@next/third-parties`), for two things the stock component
 * cannot do: send page views with a sanitized URL (see `page-location.ts`), and stop/restart in place
 * when consent changes, without reloading the page.
 *
 * Browser-only. Nothing here runs unless the visitor granted `analytics` (see `GoogleAnalyticsGate`).
 */
import { deleteCookies, listCookieNames } from "@/lib/consent/cookie";
import { sanitizePath, sanitizeQuery, sanitizeUrl } from "./page-location";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The ID `gtag('config')` ran for in this page lifetime (config must only run once). */
let configuredId: string | null = null;
/** Last page_location sent: the next page view's referrer, and a guard against duplicates. */
let lastLocation: string | null = null;

/** gtag's own kill switch, honoured on every hit. */
const setDisabled = (gaId: string, disabled: boolean) => {
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] =
    disabled;
};

/** Deletes `_ga` and `_ga_<id>` on the host and every parent domain. */
const clearGaCookies = () =>
  deleteCookies(
    listCookieNames().filter(
      (name) => name === "_ga" || name.startsWith("_ga_"),
    ),
  );

/**
 * Consent granted: define gtag and queue the consent state + config (gtag.js, loaded afterwards,
 * drains the queue in order). On a later re-grant in the same page, only flips consent back on.
 */
export const startGtag = (gaId: string) => {
  setDisabled(gaId, false);
  if (configuredId === gaId) {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    return;
  }
  const dataLayer = window.dataLayer || [];
  window.dataLayer = dataLayer;
  window.gtag = function gtag() {
    // biome-ignore lint/complexity/noArguments: gtag.js only processes real `arguments` objects, not arrays.
    dataLayer.push(arguments);
  };
  // Analytics granted, every advertising signal denied (this site uses no ads features).
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  // Page views are sent by hand from `sendPageView`, never from the raw URL.
  window.gtag("config", gaId, { send_page_view: false });
  configuredId = gaId;
};

/** Consent withdrawn (here or in another tab): no further hits, no cookie writes, cookies wiped. */
export const stopGtag = (gaId: string) => {
  if (configuredId === gaId) {
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
  }
  setDisabled(gaId, true);
  clearGaCookies();
  lastLocation = null;
};

/** Sends a page_view for `pathname` with the sanitized URL and referrer. */
export const sendPageView = (pathname: string) => {
  if (!window.gtag) return;
  const { origin, search } = window.location;
  const pageLocation = `${origin}${sanitizePath(pathname)}${sanitizeQuery(search)}`;
  if (pageLocation === lastLocation) return;
  const pageReferrer = lastLocation ?? sanitizeUrl(document.referrer, origin);
  lastLocation = pageLocation;
  const page = { page_location: pageLocation, page_referrer: pageReferrer };
  // `set` so every later event on this page (custom, scroll, clicks) reports the sanitized URL too.
  window.gtag("set", page);
  window.gtag("event", "page_view", page);
};
