import type { Metadata } from "next";
import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/shadcn/sonner";
import { cn } from "@repo/ui/lib/utils";
import { ThemeProvider } from "@repo/ui/providers/theme.provider";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { getServerEnv } from "@/env/server";
import { body, brand } from "@/font";
import { routing } from "@/i18n/routing";
import { AppStatusProvider } from "@/lib/providers/app-status.provider";

export const metadata: Metadata = {
  title: "A11STUDIO — The Portfolio Platform Built for Artists",
  description:
    "Showcase your work, get discovered, and connect with collectors and collaborators. A11STUDIO is the portfolio platform designed exclusively for artists.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "A11STUDIO — The Portfolio Platform Built for Artists",
    description:
      "Showcase your work, get discovered, and connect with collectors and collaborators.",
    siteName: "A11STUDIO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "A11STUDIO — The Portfolio Platform Built for Artists",
    description:
      "Showcase your work, get discovered, and connect with collectors and collaborators.",
  },
};

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
