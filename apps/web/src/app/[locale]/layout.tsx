import type { Metadata, Viewport } from "next";
import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/shadcn/sonner";
import { cn } from "@repo/ui/lib/utils";
import { ThemeProvider } from "@repo/ui/providers/theme.provider";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { getServerEnv } from "@/env/server";
import { body, brand } from "@/font";
import { routing } from "@/i18n/routing";
import { AppStatusProvider } from "@/lib/providers/app-status.provider";
import { OG_LOCALE, ogImage, resolveLocale, SITE_NAME } from "@/lib/seo/core";
import { isIndexableEnv } from "@/lib/seo/indexability";

const appUrl = getServerEnv().APP_URL;

/** Browser UI colour follows the page background (design tokens `--color-bg`, light / dark). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1B19" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t("defaultTitle");
  const description = t("defaultDescription");
  const card = ogImage(null, SITE_NAME);

  return {
    ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
    // `default` is the localized fallback for any page without its own title; `template` appends the
    // brand to every child string title (e.g. "Brutalist Facade" -> "Brutalist Facade · A11STUDIO").
    // Brand-ful pages (landing/legal/etc.) opt out via `title.absolute`.
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    // Domain ownership proofs. Pinterest's "claim website" puts the verified domain on every pin
    // from a11studio.com. The token is public by design (it is served in every page's <head>).
    verification: {
      other: { "p:domain_verify": "846081cf0257d520cae5da78f0f2e9a7" },
    },
    // Profiles print phone numbers; iOS Safari would otherwise auto-link every digit run it sees.
    formatDetection: { telephone: false, email: false, address: false },
    // Favicon + apple-touch icons (files in public/). The PWA icons are declared in manifest.ts.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    // Site-wide noindex on every deployment that is not the canonical production origin (dev,
    // local, preview). `nocache`/`noarchive` also keep a duplicate out of caches and snippets.
    // On production, pages are indexable by default and each page's own metadata (a missing
    // entity, a private route, an incomplete profile) can still opt out.
    ...(isIndexableEnv()
      ? {}
      : {
          robots: {
            index: false,
            follow: false,
            nocache: true,
            noarchive: true,
          },
        }),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALE[resolveLocale(locale)],
      // Site-wide fallback card for any page that doesn't set its own openGraph (the 1200×630
      // brand card). Pages that set their own openGraph replace this wholesale.
      images: [card],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: card.url, alt: card.alt }],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: requestedLocale } = await params;
  // The locale middleware prefixes every normal path, so an unknown locale segment only happens for
  // dotted paths it skips (`/sitemap.xml`, `/llms.txt`, `/.well-known/…`). Those used to render the
  // home page with a 200 — a real 404 is the honest answer. Runs before anything can stream.
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale;

  setRequestLocale(locale);
  const isRegisterClose = !getServerEnv().REGISTRATION_IS_CLOSED;

  return (
    <html
      lang={locale.toLowerCase()}
      className={cn(brand.variable, body.variable)}
      suppressHydrationWarning
    >
      <body className="w-screen h-dvh flex flex-col items-center justify-start">
        <AppStatusProvider isRegisterClose={isRegisterClose}>
          <NextIntlClientProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </AppStatusProvider>
      </body>
    </html>
  );
}
