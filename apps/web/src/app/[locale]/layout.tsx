import type { Metadata } from "next";
import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/shadcn/sonner";
import { cn } from "@repo/ui/lib/utils";
import { ThemeProvider } from "@repo/ui/providers/theme.provider";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { dmSans, playfair } from "@/font";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "A11STUDIO — The Portfolio Platform Built for Artists",
  description:
    "Showcase your work, get discovered, and connect with collectors and collaborators. A11STUDIO is the portfolio platform designed exclusively for artists.",
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
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale.toLowerCase()}
      className={cn(playfair.variable, dmSans.variable)}
      suppressHydrationWarning
    >
      <body className="w-screen h-screen flex flex-col items-center justify-start">
        <NextIntlClientProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
