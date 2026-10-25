import "@repo/ui/globals.css";
import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { cn } from "@repo/ui/lib/utils";
import { ThemeProvider } from "@repo/ui/providers/theme.provider";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { body, brand } from "@/font";
import { NotFoundView } from "@/lib/components/not-found-view";
import { SITE_NAME } from "@/lib/seo/core";

/**
 * 404 for URLs outside any valid locale (`/wp-login.php`, `/.well-known/…`, `/xx.php/a/b`): the
 * `notFound()` thrown by `[locale]/layout.tsx` for an invalid locale, and unmatched paths the locale
 * proxy skipped. It renders above `[locale]/layout.tsx`, so it brings its own document. Kept minimal
 * (no session, intl provider, header or footer) because scanner probes hit it constantly. These
 * URLs carry no locale, so English (x-default) is the honest choice. Next injects `noindex`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "notFoundPage" });
  return { title: { absolute: `${t("metaTitle")} · ${SITE_NAME}` } };
}

export default function RootNotFound() {
  return (
    <html
      lang="en"
      className={cn(brand.variable, body.variable)}
      suppressHydrationWarning
    >
      <body className="w-screen min-h-dvh flex flex-col">
        <ThemeProvider>
          <header className="w-full px-6 py-6 tablet:px-10">
            <Link href="/" aria-label={SITE_NAME} className="inline-flex w-fit">
              <BrandLogo />
            </Link>
          </header>
          <main className="flex-1 w-full">
            <NotFoundView locale="en" />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
