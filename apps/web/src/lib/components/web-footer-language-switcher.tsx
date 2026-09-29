"use client";

import { cn } from "@repo/ui/lib/utils";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Link as LocaleLink,
  localeLabels,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  usePathname,
} from "@/i18n/navigation";

/**
 * A plain row of links rather than a dropdown: a Radix menu only mounts its items while open, so
 * the server HTML had no links to this page in the other languages for crawlers to follow.
 */
export const WebFooterLanguageSwitcher = () => {
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      aria-label={t("language")}
      className="inline-flex items-center gap-3 text-xs tracking-wider text-text-muted"
    >
      <Globe className="size-3.5" aria-hidden />
      {(SUPPORTED_LOCALES as readonly SupportedLocale[]).map((loc) => (
        // Shared routing (`defineRouting` without `pathnames`): `href` is `string | UrlObject`
        // only — never pass `params`. `usePathname()` from `@/i18n/navigation` is already
        // localized and resolved (dynamic segments filled).
        <LocaleLink
          key={loc}
          href={pathname}
          locale={loc}
          hrefLang={loc}
          aria-current={locale === loc ? "true" : undefined}
          className={cn(
            "transition-colors hover:text-text focus-visible:text-text outline-none",
            locale === loc && "font-medium text-text",
          )}
        >
          {localeLabels[loc]}
        </LocaleLink>
      ))}
    </nav>
  );
};
