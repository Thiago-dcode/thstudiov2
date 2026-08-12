import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { getGalleryLabels } from "@/lib/gallery-labels";
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
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { buildPortfolioJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
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
  const { data } = await userPortfolioService.getSeoMetadata(
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
  const t = await getTranslations("artists.portfolios");
  const tNotFound = await getTranslations("artists.resourceNotFound");
  const tEdit = await getTranslations("artists.editAria");

  const [userExist, response, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getByUsername(username, slug),
    userSession(),
  ]);
  if (!userExist.data) {
    notFound();
  }

  const portfolio = response.data;
  if (!portfolio || portfolio.blocked_at) {
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message={tNotFound("portfolio")}
        />
      </Web.Container>
    );
  }

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio);
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);
  const canEdit = userAuth?.id === portfolio.user_id;
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
      <JsonLd data={buildPortfolioJsonLd(portfolio, username)} />
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
          <Link
            href={`/atelier/portfolios/edit/${portfolio.slug}`}
            aria-label={tEdit("editPortfolio")}
            className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
          >
            <Pencil className="size-4 md:size-5" />
          </Link>
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
              title: `${m.title ?? ""} ${m.fromCollection ? ` (Collection: ${m.fromCollection})` : ""}`,
              description: m.seo_description ?? undefined,
              url: m.url ?? m.thumbnail,
              alt: m.seo_alt ?? m.title ?? undefined,
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
