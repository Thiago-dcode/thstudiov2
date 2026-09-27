import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isMissingResponse } from "@/lib/seo/core";
import { artistDisplayName } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { getArtistProfileResponse } from "@/modules/users/get-artist-share-ready";

export type ArtistListKind = "portfolios" | "collections" | "services";

/**
 * Metadata for an artist's list page (`/artists/{u}/portfolios|collections|services`).
 *
 * - Title and description name the artist AND their profession and locality — the old description
 *   was one boilerplate sentence repeated for every artist on the platform.
 * - An empty list is `noindex`: "No collections yet." is a thin page, not a result.
 * - Same share-ready gate as the profile, so an artist's surfaces can't disagree.
 */
export async function buildArtistListMetadata({
  kind,
  locale,
  username,
  count,
  image,
}: {
  kind: ArtistListKind;
  locale: string;
  username: string;
  /** Items on the list — 0 means an empty, thin page. */
  count: number;
  /** Share image: the first item's cover, else the artist's banner/avatar. */
  image?: string | null;
}): Promise<Metadata> {
  const [response, t] = await Promise.all([
    getArtistProfileResponse(username),
    getTranslations(`artists.${kind}`),
  ]);
  if (isMissingResponse(response)) notFound();
  const profile = response.data;
  if (!profile) return { robots: { index: false, follow: false } };

  const name = artistDisplayName(profile);
  const profession = profile.profession?.trim();
  const location =
    profile.address?.city?.trim() || profile.address?.state?.trim();

  return buildStaticPageMetadata({
    path: `/artists/${profile.username}/${kind}`,
    title: t("listTitle", { name }),
    description:
      profession && location
        ? t("metaDescriptionDetailed", { name, profession, location })
        : t("metaDescription", { name }),
    locale,
    image: profile.is_share_ready
      ? image || profile.banner || profile.avatar
      : null,
    noindex: !profile.is_share_ready || count === 0,
  });
}
