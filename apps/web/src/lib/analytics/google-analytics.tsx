"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useConsent } from "@/lib/providers/consent.provider";
import { sendPageView, startGtag, stopGtag } from "./gtag";

/**
 * The only place GA4 is mounted. gtag.js is requested only once the `analytics` category is granted;
 * rejecting (or never choosing) leaves no Google script, cookie or request on the page.
 *
 * Consent changes apply in place, never with a reload: the provider also re-reads the cookie when a
 * tab regains focus, and reloading that tab could kill an upload or an unsaved draft in progress.
 */
export const GoogleAnalyticsGate = ({ gaId }: { gaId?: string }) => {
  const { ready, has } = useConsent();
  const granted = has("analytics");
  const pathname = usePathname();
  const [scriptRequested, setScriptRequested] = useState(false);

  // Must stay above the page-view effect: on the first grant both run in the same commit, in order.
  useEffect(() => {
    // `ready` first: before the cookie is read `granted` is false, and that must not wipe `_ga`.
    if (!gaId || !ready) return;
    if (granted) {
      startGtag(gaId);
      setScriptRequested(true);
    } else {
      stopGtag(gaId);
    }
  }, [gaId, ready, granted]);

  useEffect(() => {
    if (gaId && granted) sendPageView(pathname);
  }, [gaId, granted, pathname]);

  if (!gaId || !scriptRequested) return null;

  return (
    <Script
      id="gtag-js"
      src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      strategy="afterInteractive"
    />
  );
};
