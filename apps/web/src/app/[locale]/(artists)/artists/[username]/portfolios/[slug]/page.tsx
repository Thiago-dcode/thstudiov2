import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { localePrefix, urlLocaleToLanguageCode } from "@/i18n/routing";
import Web from "@/lib/components/web-page.component";
import { config } from "@/lib/config";
import { getGalleryLabels } from "@/lib/gallery-labels";
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { isMissingResponse, redirectToCanonicalUsername } from "@/lib/seo/core";
import {
  artistDisplayName,
  buildPortfolioJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";
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
  redirectToCanonicalUsername(locale, username, `/portfolios/${slug}`);
  const response = await userPortfolioService.getSeoMetadata(
    username,
    slug,
    urlLocaleToLanguageCode(locale),
  );
  // Resolved before the first byte, so a missing or blocked portfolio is a real 404 — the page's own
  // "not found" view used to answer with a 200.
  if (isMissingResponse(response)) notFound();
  const { data } = response;
  if (!data) return { robots: { index: false, follow: false } };

  return buildSeoMetadata(data, locale, { title: slug });
}

export default async function Page({ params, searchParams }: Props) {
  const { locale, username, slug } = await params;
  const t = await getTranslations("artists.portfolios");
  const tEdit = await getTranslations("artists.editAria");

  const [userExist, response, userAuth, profile, seo] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getByUsername(username, slug),
    userSession(),
    getArtistProfile(username),
    userPortfolioService.getSeoMetadata(
      username,
      slug,
      urlLocaleToLanguageCode(locale),
    ),
  ]);
  if (!userExist.data) {
    notFound();
  }

  const portfolio = response.data;
  if (!portfolio || portfolio.blocked_at) {
    notFound();
  }

  const canEdit = userAuth?.id === portfolio.user_id;
  // A deactivated portfolio is hidden from visitors; its owner can still preview it.
  if (!portfolio.is_active && !canEdit) {
    notFound();
  }

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio);
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);
  const artist = {
    username,
    name: profile ? artistDisplayName(profile) : `@${username}`,
  };
  const qp = await searchParams;

  let defaultCurrentItem: number | undefined;

  if (qp?.ci) {
    const index = mediaItems.findIndex((m) => m.public_id === qp.ci);
    if (index !== -1) {
      defaultCurrentItem = index;
    }
  }

  return (
    <Web.Container>
      <JsonLd
        data={buildPortfolioJsonLd(
          portfolio,
          artist,
          locale,
          t("pageTitle"),
          seo.data?.seo_description,
        )}
      />
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/portfolios`,
            title: t("pageTitle"),
            isActive: false,
          },
          {
            url: `/artists/${username}/portfolios/${slug}`,
            title: portfolio.title,
            isActive: true,
          },
        ]}
      />

      <Web.Header
        title={portfolio.title}
        description={portfolio.description || undefined}
      >
        {canEdit && (
          <Web.EditLink
            href={`/atelier/portfolios/edit/${portfolio.slug}`}
            label={tEdit("editPortfolio")}
          />
        )}
      </Web.Header>

      {portfolio.categories && portfolio.categories.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-2">
          {portfolio.categories.map((category) => (
            <Badge
              key={category.id}
              variant="outline"
              className="border-border/40 bg-fg-2/20 px-3 py-1 text-[11px] font-normal tracking-wide text-text-muted"
            >
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      <section className="relative m-auto">
        {portfolio.media.length > 0 ? (
          <GalleryProvider
            labels={await getGalleryLabels()}
            defaultCurrentItem={defaultCurrentItem}
            items={mediaItems.map((m) => ({
              title: m.fromCollection
                ? t("fromCollection", {
                    title: m.title ?? "",
                    collection: m.fromCollection,
                  })
                : (m.title ?? ""),
              description: m.seo_description ?? undefined,
              url: m.url ?? m.thumbnail,
              alt: m.seo_alt ?? m.title ?? undefined,
              // The lightbox needs both to play a video: the type to pick <video> over
              // <img>, and the poster for the frame shown before playback starts.
              mediaType: m.media_type,
              poster: m.thumbnail,
              // Root-relative and locale-prefixed: an absolute `${config.app_url}/…` href always
              // pointed at the English URL, and the `?cb=1` cache-buster minted a second crawlable
              // URL for every media page. `shared` stays absolute — it is pasted into messengers.
              href: `${localePrefix(locale)}/artists/${username}/portfolios/${slug}/media/${m.public_id}`,
              shared: `${config.app_url}${localePrefix(locale)}/artists/${username}/portfolios/${slug}/media/${m.public_id}`,
            }))}
          >
            <PortfolioGrid
              portfolioItems={portfolioItems}
              layout={portfolio.layout}
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
