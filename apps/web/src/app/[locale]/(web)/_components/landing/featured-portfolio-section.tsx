import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { editorialHeadlineClass } from "@repo/ui/components/custom/editorial";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getGalleryLabels } from "@/lib/gallery-labels";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { NextSectionArrow } from "./next-section-arrow";
import { reportSectionError } from "./section-error";
import {
  EDITORIAL_LINK_CLASS,
  editorialNumber,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

const LAYOUT_KEYS = {
  MASONRY: "masonry",
  UNIFORM: "uniform",
  COLUMN_BASE: "columns",
} as const;

/**
 * The featured portfolio: a static, keyword-bearing h2 ("a photography portfolio made on
 * A11STUDIO") with the portfolio's own title as the h3 under it, a line of real facts and a way into
 * the full portfolio.
 */
export async function FeaturedPortfolioSection({
  id,
  nextSectionId,
  index,
}: LandingSectionProps) {
  const [t, portfolioResponse] = await Promise.all([
    getTranslations("landing.featuredPortfolio"),
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
      className="overflow-hidden max-w-(--breakpoint-desktop) w-full max-h-[200svh] mx-auto"
    >
      <WebSection.Container className="pt-24">
        <div className="flex w-full flex-col gap-10 laptop:gap-14">
          {/* Same opening as the other homepage sections (hairline, label, serif headline), with the
              portfolio's credit set like a caption in the right column. */}
          <header className="mx-3 flex flex-col gap-8 border-t border-border pt-6 tablet:mx-6 tablet:flex-row tablet:items-end tablet:justify-between laptop:pt-8">
            <div className="flex max-w-4xl flex-col gap-6">
              <WebSection.Label
                qualifier={index ? editorialNumber(index) : undefined}
              >
                {t("badge")}
              </WebSection.Label>
              <h2 className={editorialHeadlineClass("section")}>
                {t("title")}
              </h2>
            </div>
            <div className="flex max-w-sm flex-col gap-3 tablet:items-end tablet:text-right">
              <h3 className="line-clamp-2 font-serif! text-xl! font-normal! italic leading-snug!">
                {portfolio.title}
              </h3>
              <p className="text-sm! text-text-muted">
                {t("by")}{" "}
                <Link
                  href={`/artists/${encodeURIComponent(username)}`}
                  className="text-text underline decoration-border-em underline-offset-4 transition-colors hover:decoration-text"
                >
                  @{username}
                </Link>
              </p>
              <WebSection.Label>{facts.join(" · ")}</WebSection.Label>
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
            <WebSection.ActionLink
              href={portfolioHref}
              className={EDITORIAL_LINK_CLASS}
            >
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
