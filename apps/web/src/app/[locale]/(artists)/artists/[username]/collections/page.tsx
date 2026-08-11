import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const [{ data: profile }, t] = await Promise.all([
    usersService.getProfile(username),
    getTranslations("artists.collections"),
  ]);

  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const name =
    [profile.name, profile.surname].filter(Boolean).join(" ") || `@${username}`;
  return buildStaticPageMetadata({
    path: `/artists/${username}/collections`,
    title: `${name} — ${t("pageTitle")}`,
    description: t("metaDescription", { name }),
    locale,
    // An incomplete profile stays out of the index and off rich share cards — same gate as the
    // profile page and the sitemap, so the artist's surfaces can't disagree.
    image: profile.is_share_ready
      ? profile.banner || profile.avatar || undefined
      : undefined,
    noindex: !profile.is_share_ready,
  });
}

export default async function Page({ params }: Props) {
  const { username } = await params;
  const t = await getTranslations("artists.collections");

  const [userExist, response] = await Promise.all([
    usersService.usernameExists(username),
    userCollectionService.getAllByUsername(username, { blocked: false }),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const collections = response.data || [];

  return (
    <Web.Container>
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
