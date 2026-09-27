import { normalizeUsername } from "@repo/common-lib/utils/username";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { buildArtistListMetadata } from "@/app/[locale]/(artists)/__components/artist-list-metadata";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import {
  artistDisplayName,
  buildArtistListJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

/** Public list: deactivated collections are the owner's business, not visitors'. */
const PUBLIC_FILTERS = { blocked: false, is_active: true } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const { data: collections } = await userCollectionService.getAllByUsername(
    username,
    PUBLIC_FILTERS,
  );
  return buildArtistListMetadata({
    kind: "collections",
    locale,
    username,
    count: collections?.length ?? 0,
    image: collections?.[0]?.media?.[0]?.thumbnail,
  });
}

export default async function Page({ params }: Props) {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const t = await getTranslations("artists.collections");

  const [userExist, response, profile] = await Promise.all([
    usersService.usernameExists(username),
    userCollectionService.getAllByUsername(username, PUBLIC_FILTERS),
    getArtistProfile(username),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const collections = response.data || [];
  const name = profile ? artistDisplayName(profile) : `@${username}`;

  return (
    <Web.Container>
      {profile?.is_share_ready && collections.length > 0 && (
        <JsonLd
          data={buildArtistListJsonLd({ username, name }, locale, {
            path: `/artists/${username}/collections`,
            name: t("listTitle", { name }),
            items: collections.map((c) => ({
              name: c.title,
              path: `/artists/${username}/collections/${c.slug}`,
              image: c.media?.[0]?.thumbnail,
            })),
          })}
        />
      )}
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/collections`,
            title: t("pageTitle"),
            isActive: true,
          },
        ]}
      />

      <Web.Header title={t("pageTitle")} />

      {collections.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/artists/${username}/collections/${collection.slug}`}
            >
              <CollectionCard collection={collection} isAtelier={false} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm  text-text-muted">
          {t("empty")}
        </div>
      )}
    </Web.Container>
  );
}
