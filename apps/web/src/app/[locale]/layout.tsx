import type { Metadata } from "next";
import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/shadcn/sonner";
import { cn } from "@repo/ui/lib/utils";
import { ThemeProvider } from "@repo/ui/providers/theme.provider";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { getServerEnv } from "@/env/server";
import { body, brand } from "@/font";
import { routing } from "@/i18n/routing";
import { DEFAULT_OG_IMAGE } from "@/lib/config";
import { AppStatusProvider } from "@/lib/providers/app-status.provider";

const appUrl = getServerEnv().APP_URL;
const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";

const SITE_NAME = "A11STUDIO";
/** Open Graph locale per app language for the site-wide default OG card. */
const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
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

  return {
    ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
    // `default` is the localized fallback for any page without its own title; `template` appends the
    // brand to every child string title (e.g. "Brutalist Facade" -> "Brutalist Facade · A11STUDIO").
    // Brand-ful pages (landing/legal/etc.) opt out via `title.absolute`.
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    // Favicon + apple-touch icons (files in public/). The PWA icons are declared in manifest.ts.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    // Site-wide noindex OUTSIDE production; in production pages are indexable by default and each
    // page's own metadata (e.g. a missing entity, or a noindex flag) can still opt out.
    ...(isProduction ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALE[locale] ?? "en_US",
      // Site-wide fallback card for any page that doesn't set its own openGraph (resolved to
      // absolute via metadataBase). Pages that set their own openGraph replace this wholesale.
      images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
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
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

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
