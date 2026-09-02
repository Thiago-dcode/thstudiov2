import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { GalleryGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import { Link } from "@/i18n/navigation";
import { localePrefix, urlLocaleToLanguageCode } from "@/i18n/routing";
import Web from "@/lib/components/web-page.component";
import { config } from "@/lib/config";
import { getGalleryLabels } from "@/lib/gallery-labels";
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { buildCollectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string; slug: string }>;
  searchParams: Promise<{ ci?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, username, slug } = await params;
  const { data } = await userCollectionService.getSeoMetadata(
    username,
    slug,
    urlLocaleToLanguageCode(locale),
  );

  if (!data) {
    return { robots: { index: false, follow: false } };
  }

  return buildSeoMetadata(data, locale, { title: data.seo_title || username });
}

export default async function Page({ params, searchParams }: Props) {
  const { locale, username, slug } = await params;
  const t = await getTranslations("artists.collections");
  const tNotFound = await getTranslations("artists.resourceNotFound");
  const tEdit = await getTranslations("artists.editAria");

  const [userExist, response, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userCollectionService.getByUsername(
      username,
      slug,
      urlLocaleToLanguageCode(locale),
    ),
    userSession(),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const collection = response.data;
  if (!collection || collection.blocked_at) {
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message={tNotFound("collection")}
        />
      </Web.Container>
    );
  }

  const canEdit = userAuth?.id === collection.user_id;

  const qp = await searchParams;

  let defaultCurrentItem: number | undefined;

  if (qp?.ci) {
    const splitted = qp.ci.split("_");
    if (splitted.length === 2) {
      const validTypes = ["m"];
      const itemType = splitted[0];

      if (validTypes.find((vt) => vt === itemType)) {
        if (itemType === "m") {
          const public_id = splitted[1];
          const index = collection.media?.findIndex(
            (m) => m.public_id === public_id,
          );
          if (index !== undefined && index !== -1) {
            defaultCurrentItem = index;
          }
        }
      }
    }
  }

  return (
    <Web.Container>
      <JsonLd data={buildCollectionJsonLd(collection, username)} />
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/collections`,
            title: t("pageTitle"),
            isActive: false,
          },
          {
            url: `/artists/${username}/collections/${slug}`,
            title: collection.title,
            isActive: true,
          },
        ]}
      />

      <Web.Header
        title={collection.title}
        description={collection.description || undefined}
      >
        {canEdit && (
          <Link
            href={`/atelier/collections/edit/${collection.slug}`}
            aria-label={tEdit("editCollection")}
            className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
          >
            <Pencil className="size-4 md:size-5" />
          </Link>
        )}
      </Web.Header>

      <section className="relative">
        {collection.media && collection.media.length > 0 ? (
          <GalleryProvider
            labels={await getGalleryLabels()}
            defaultCurrentItem={defaultCurrentItem}
            items={collection.media.map((m) => ({
              title: m.title,
              description: m.seo_description ?? undefined,
              // `url` is nullable while a media is still processing; the gallery already
              // renders a placeholder for a missing one, so normalise null to undefined
              // rather than dropping the item and shifting every index.
              url: m.url ?? undefined,
              alt: m.seo_alt ?? m.title ?? undefined,
              // Root-relative and locale-prefixed: an absolute `${config.app_url}/…` href always
              // pointed at the English URL, and the `?cb=1` cache-buster minted a second crawlable
              // URL for every media page. `shared` stays absolute — it is pasted into messengers.
              href: `${localePrefix(locale)}/artists/${username}/collections/${slug}/media/${m.public_id}`,
              shared: `${config.app_url}${localePrefix(locale)}/artists/${username}/collections/${slug}/media/${m.public_id}`,
            }))}
          >
            <GalleryGrid
              media={collection.media}
              layout={{ name: "UNIFORM", config: null }}
            />
            <div className="hidden tablet:block">
              <Gallery />
            </div>
          </GalleryProvider>
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm  text-text-muted">
            {t("galleryEmpty")}
          </div>
        )}
      </section>
    </Web.Container>
  );
}
