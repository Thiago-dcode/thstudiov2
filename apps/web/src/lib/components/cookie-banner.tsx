"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/lib/providers/consent.provider";

/**
 * Cookie banner. Shown while some active category has no stored choice, or when the footer
 * "Cookie settings" link reopens it. Reads and writes everything through {@link useConsent}.
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

  const showBanner =
    ready && categories.length > 0 && (needsDecision || settingsOpen);

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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-fg-2 bg-bg outline-none"
    >
      <div className="mx-auto flex max-w-(--screen-ultrawide) flex-col gap-3 px-4 py-3 phone-lg:flex-row phone-lg:items-center phone-lg:justify-between phone-lg:gap-6 tablet:px-10">
        <p
          id="cookie-consent-body"
          // `!`: the global unlayered `p { font-size }` rule otherwise beats `text-xs`.
          className="max-w-xl text-xs! leading-snug tracking-wider text-text-muted"
        >
          {t("body")}{" "}
          <Link
            href="/legal/cookies"
            className="text-text underline underline-offset-4"
          >
            {t("learnMore")}
          </Link>
        </p>
        {/* Equal weight on purpose: same variant, size and order-neutral labels (no dark pattern). */}
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 flex-1 px-5 phone-lg:flex-none"
            onClick={rejectAll}
          >
            {t("reject")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 flex-1 px-5 phone-lg:flex-none"
            onClick={acceptAll}
          >
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
};
