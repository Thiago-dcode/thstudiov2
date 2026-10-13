"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/lib/providers/consent.provider";

/**
 * First-visit delay. The banner lands once the page has painted and the visitor has started looking
 * at it: it never covers the first impression (or the LCP), and a visitor who already sees what the
 * site is about is more willing to help. Nothing optional runs meanwhile, so waiting costs nothing.
 */
const REVEAL_DELAY_MS = 1500;

/**
 * Cookie banner. Shown while some active category has no stored choice, or when the footer
 * "Cookie settings" link reopens it. Reads and writes everything through {@link useConsent}.
 *
 * Accept is the solid button, Decline the outline one. That emphasis is as far as it goes: Decline
 * stays on the first layer, same size, same position level, readable text, plain label. AEPD / EDPB
 * guidance treats a hidden, tiny, low-contrast or guilt-tripping reject as a dark pattern that
 * invalidates the consent, so do not push it further than this.
 */
export const CookieBanner = () => {
  const t = useTranslations("cookieConsent");
  const {
    ready,
    categories,
    needsDecision,
    settingsOpen,
    acceptAll,
    rejectAll,
  } = useConsent();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!ready || !needsDecision) return;
    const timer = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, needsDecision]);

  const showBanner =
    ready &&
    categories.length > 0 &&
    ((needsDecision && revealed) || settingsOpen);

  // Reopened from the footer: move focus into the banner so keyboard/screen-reader users land on it.
  useEffect(() => {
    if (settingsOpen) bannerRef.current?.focus();
  }, [settingsOpen]);

  if (!showBanner) return null;

  return (
    <div
      ref={bannerRef}
      // Non-modal: the site stays usable without choosing (no cookie wall).
      role="dialog"
      aria-modal="false"
      aria-label={t("title")}
      aria-describedby="cookie-consent-body"
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-fg-2 bg-bg outline-none animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
    >
      <div className="mx-auto flex max-w-(--screen-ultrawide) flex-col gap-4 px-4 py-4 phone-lg:flex-row phone-lg:items-center phone-lg:justify-between phone-lg:gap-8 tablet:px-10 tablet:py-5">
        <div className="flex max-w-xl flex-col gap-1">
          {/* `!`: the global unlayered `p { font-size }` rule otherwise beats the size utilities. */}
          <p className="font-serif text-base! leading-tight text-text">
            {t("lead")}
          </p>
          <p
            id="cookie-consent-body"
            className="text-xs! leading-relaxed tracking-wider text-text-muted"
          >
            {t("body")}{" "}
            <Link
              href="/legal/cookies"
              className="text-text underline underline-offset-4"
            >
              {t("learnMore")}
            </Link>
          </p>
        </div>
        {/* Same size and level for both (see above). Accept sits last: the reading end and the thumb side. */}
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 flex-1 px-6 phone-lg:flex-none"
            onClick={rejectAll}
          >
            {t("reject")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="min-h-11 flex-1 px-6 phone-lg:flex-none"
            onClick={acceptAll}
          >
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
};
