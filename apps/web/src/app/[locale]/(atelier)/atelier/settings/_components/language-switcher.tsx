"use client";

import { Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import {
  Link as LocaleLink,
  localeLabels,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  usePathname,
} from "@/i18n/navigation";

export const AtelierLanguageSwitcher = () => {
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language")}
        className={cn(
          "group inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium text-text-muted",
          "outline-none transition-colors hover:text-text",
          "focus-visible:text-text data-[state=open]:text-text",
        )}
      >
        {localeLabels[locale]}
        <ChevronDown
          className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-36">
        {(SUPPORTED_LOCALES as readonly SupportedLocale[]).map((loc) => (
          <DropdownMenuItem key={loc} asChild>
            {/* Shared routing (`defineRouting` without `pathnames`): `href` is `string | UrlObject`
                only — never pass `params`. `usePathname()` from `@/i18n/navigation` is already
                localized and resolved (dynamic segments filled). */}
            <LocaleLink
              href={pathname}
              locale={loc}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 text-xs tracking-wider",
                locale === loc ? "font-medium text-text" : "text-text-muted",
              )}
            >
              {localeLabels[loc]}
              {locale === loc && (
                <Check className="ml-auto size-3.5" aria-hidden />
              )}
            </LocaleLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
