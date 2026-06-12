"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Link as LocaleLink,
  localeLabels,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  usePathname,
} from "@/i18n/navigation";

export const WebFooterLanguageSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
        {t("language")}
      </span>
      <div className="flex gap-1">
        {(SUPPORTED_LOCALES as readonly SupportedLocale[]).map((loc) => (
          // Shared routing (`defineRouting` without `pathnames`): `href` is `string | UrlObject` only —
          // never pass `params` here. `usePathname()` from `@/i18n/navigation` is already localized
          // and resolved (dynamic segments filled).
          <LocaleLink
            key={loc}
            href={pathname}
            locale={loc}
            className={`text-xs tracking-wider transition-colors ${
              locale === loc
                ? "text-text font-medium"
                : "text-text-muted hover:text-text"
            }`}
          >
            {localeLabels[loc]}
          </LocaleLink>
        ))}
      </div>
    </div>
  );
};
