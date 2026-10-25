import type { ReactNode } from "react";

/**
 * Pass-through root layout. `[locale]/layout.tsx` still renders `<html>`/`<body>` (the next-intl
 * pattern for a `[locale]` root), but with no layout above it nothing could catch an unmatched URL
 * or the `notFound()` that `[locale]/layout.tsx` throws for an invalid locale, so Next served its
 * built-in, unbranded 404. This file lets `app/not-found.tsx` own those. No metadata on purpose.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
