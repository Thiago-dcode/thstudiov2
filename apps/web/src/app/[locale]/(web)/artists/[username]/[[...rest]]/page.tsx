import {
  type PageSearchParams,
  redirectLegacyArtistPath,
} from "@/lib/seo/core";

type Props = {
  params: Promise<{ locale: string; username: string; rest?: string[] }>;
  searchParams: Promise<PageSearchParams>;
};

/**
 * `/artists/{username}[/…]` → 308 `/{username}[/…]` (locale and query string kept), or a 404 for a
 * reserved or invalid name. Decided in `generateMetadata`, before the first byte, so it is a real
 * 308 status; the page repeats it like every other artist redirect. Renders nothing.
 */
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, username, rest } = await params;
  return redirectLegacyArtistPath(locale, username, rest, searchParams);
}

export default async function LegacyArtistRedirect({
  params,
  searchParams,
}: Props) {
  const { locale, username, rest } = await params;
  return redirectLegacyArtistPath(locale, username, rest, searchParams);
}
