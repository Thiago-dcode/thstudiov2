import type { Metadata } from "next";
import "@repo/ui/globals.css";
import { Toaster } from "@repo/ui/components/shadcn/sonner"
import { ReactElement } from "react";
import { Roboto, Playfair_Display } from 'next/font/google'
import { cn } from "@repo/ui/lib/utils";

const roboto = Roboto({
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
})

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

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactElement;
}>) {
  return (
    <html className={cn("", roboto.className, playfair.variable)} lang="en">
      <body className=" w-screen h-screen flex  flex-col items-center justify-start">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
