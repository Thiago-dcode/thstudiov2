"use client";

import { useTranslations } from "next-intl";
import { useConsent } from "@/lib/providers/consent.provider";

/** Footer link that reopens the cookie banner so consent can be changed or withdrawn. */
export const CookieSettingsButton = () => {
  const t = useTranslations("footer.legal");
  const { categories, openSettings } = useConsent();

  // No optional category is active (anything but production): nothing to manage.
  if (categories.length === 0) return null;

  return (
    <button
      type="button"
      onClick={openSettings}
      className="w-fit cursor-pointer text-left text-sm tracking-wider text-text transition-colors hover:text-text"
    >
      {t("cookieSettings")}
    </button>
  );
};
