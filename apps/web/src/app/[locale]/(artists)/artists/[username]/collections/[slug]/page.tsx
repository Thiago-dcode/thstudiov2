import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { GalleryGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import { config } from "@/lib/config";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ ci?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const t = await getTranslations("artists.collections");
  const tNotFound = await getTranslations("artists.resourceNotFound");
  const tEdit = await getTranslations("artists.editAria");

  const [userExist, response, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userCollectionService.getByUsername(username, slug),
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
            defaultCurrentItem={defaultCurrentItem}
            items={collection.media.map((m) => ({
              title: m.title,
              description: m.seo_description ?? undefined,
              url: m.url,
              alt: m.seo_alt ?? m.title ?? undefined,
              href: `${config.app_url}/artists/${username}/collections/${slug}/media/${m.public_id}?cb=1`,
              shared: `${config.app_url}/artists/${username}/collections/${slug}/media/${m.public_id}`,
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
