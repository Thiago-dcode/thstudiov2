import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getGalleryLabels } from "@/lib/gallery-labels";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { NextSectionArrow } from "../landing/next-section-arrow";
import { reportSectionError } from "../landing/section-error";
import { type LandingSectionProps, WebSection } from "../landing/web-section";

const LAYOUT_KEYS = {
  MASONRY: "masonry",
  UNIFORM: "uniform",
  COLUMN_BASE: "columns",
} as const;

/**
 * v2 of the featured portfolio: a static, keyword-bearing h2 ("a photography portfolio made on
 * A11STUDIO") with the portfolio's own title as the h3 under it, a line of real facts and a way into
 * the full portfolio. Same data and same grid as v1.
 */
export async function FeaturedPortfolioSectionV2({
  id,
  nextSectionId,
}: LandingSectionProps) {
  const [t, portfolioResponse] = await Promise.all([
    getTranslations("landingV2.featuredPortfolio"),
    portfolioService.getFeatured(),
  ]);
  reportSectionError("featured-portfolio", portfolioResponse);
  const portfolio = portfolioResponse.data;

  if (!portfolio) return null;

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio);
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);

  if (!portfolioItems.length) return null;

  const username = portfolio.artist.username;
  const portfolioHref = portfolio.slug
    ? `/artists/${encodeURIComponent(username)}/portfolios/${encodeURIComponent(portfolio.slug)}`
    : null;
  const layoutKey = portfolio.layout
    ? LAYOUT_KEYS[portfolio.layout.name]
    : undefined;
  const facts = [
    layoutKey ? t(`layouts.${layoutKey}`) : null,
    t("works", { count: mediaItems.length }),
  ].filter(Boolean);

  return (
    <WebSection
      id={id}
      className="overflow-hidden max-w-(--breakpoint-ultrawide) max-h-[200svh] mx-auto"
    >
      <WebSection.Container className="pt-24">
        <div className="flex w-full flex-col gap-8">
          <header className="flex flex-col gap-6 px-2 tablet:flex-row tablet:items-end tablet:justify-between">
            <div className="flex max-w-3xl flex-col gap-4">
              <span className="text-xs! font-semibold uppercase tracking-[0.2em] text-text-muted">
                {t("badge")}
              </span>
              <h2 className="font-serif! text-3xl! font-medium! leading-[1.1]! tracking-tight tablet:text-4xl! laptop:text-5xl!">
                {t("title")}
              </h2>
            </div>
            <div className="flex flex-col gap-1 tablet:items-end tablet:text-right">
              <h3 className="line-clamp-2 text-lg! font-medium!">
                {portfolio.title}
              </h3>
              <p className="text-sm! text-text-muted">
                {t("by")}{" "}
                <Link
                  href={`/artists/${encodeURIComponent(username)}`}
                  className="font-medium text-text underline-offset-4 hover:underline"
                >
                  @{username}
                </Link>
              </p>
              <p className="text-sm! text-text-muted">{facts.join(" · ")}</p>
            </div>
          </header>

          <div className="flex flex-col m-auto overflow-hidden size-full">
            <GalleryProvider
              labels={await getGalleryLabels()}
              items={mediaItems.map((m) => ({
                url: m.url ?? m.thumbnail,
                alt: m.seo_alt ?? m.title ?? undefined,
                // The lightbox needs both to play a video: the type to pick <video> over
                // <img>, and the poster for the frame shown before playback starts.
                mediaType: m.media_type,
                poster: m.thumbnail,
              }))}
            >
              <Gallery />
              {/* Below the hero: lazy-load every tile so none competes with the hero images. */}
              <PortfolioGrid
                layout={portfolio.layout}
                portfolioItems={portfolioItems}
                priorityCount={0}
              />
            </GalleryProvider>
          </div>
        </div>
      </WebSection.Container>
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div
          className="featured-portfolio-fade pointer-events-none"
          aria-hidden
        />
        {portfolioHref ? (
          <div className="absolute inset-x-0 bottom-24 flex justify-center">
            <WebSection.ActionLink href={portfolioHref}>
              {t("viewFull")}
            </WebSection.ActionLink>
          </div>
        ) : null}
        <NextSectionArrow nextSectionId={nextSectionId} />
      </div>
      <style>{`
        .featured-portfolio-fade {
          height: clamp(18rem, 42vw, 32rem);
          background: linear-gradient(
            to bottom,
            transparent 0%,
            color-mix(in oklab, var(--color-bg) 18%, transparent) 12%,
            color-mix(in oklab, var(--color-bg) 45%, transparent) 32%,
            color-mix(in oklab, var(--color-bg) 72%, transparent) 52%,
            color-mix(in oklab, var(--color-bg) 92%, var(--color-fg-1)) 72%,
            var(--color-bg) 88%
          );
        }

        .featured-portfolio-fade::before {
          content: "";
          position: absolute;
          inset: 0;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgb(0 0 0 / 0.35) 15%,
            rgb(0 0 0 / 0.65) 38%,
            rgb(0 0 0 / 0.9) 62%,
            black 85%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgb(0 0 0 / 0.35) 15%,
            rgb(0 0 0 / 0.65) 38%,
            rgb(0 0 0 / 0.9) 62%,
            black 85%
          );
        }
      `}</style>
    </WebSection>
  );
}
