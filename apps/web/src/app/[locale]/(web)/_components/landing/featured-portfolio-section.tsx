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
import { reportSectionError } from "./section-error";
import { WebSection } from "./web-section";

export async function FeaturedPortfolioSection() {
  const t = await getTranslations("landing.featuredPortfolio");
  const portfolioResponse = await portfolioService.getFeatured();
  reportSectionError("featured-portfolio", portfolioResponse);
  const portfolio = portfolioResponse.data;

  if (!portfolio) return null;

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio);
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);

  if (!portfolioItems.length) return null;

  return (
    <WebSection
      id="featured-portfolio"
      className="overflow-hidden max-w-(--breakpoint-ultrawide) max-h-[200svh] mx-auto"
    >
      <WebSection.Container className="pt-24">
        <div className="flex w-full flex-col  gap-2">
          <div className="flex flex-col   w-full">
            <div className="flex flex-col items-start justify-start gap-2">
              <h2 className="line-clamp-2 laptop:line-clamp-1">
                {portfolio.title}
              </h2>
              {/* <p className=" line-clamp-3 laptop:line-clamp-none">
                {portfolio.description}
              </p> */}
              {/* h3, not h4: the section heading above is an h2, and skipping a level breaks the
                  document outline crawlers read. */}
              <h3 className="text-end pb-1 mr-1">
                {t("by")}:{" "}
                <Link
                  href={`/artists/${portfolio.artist.username}`}
                  className="font-medium"
                  aria-label={t("viewProfile", {
                    username: portfolio.artist.username,
                  })}
                >
                  {portfolio.artist.username}
                </Link>
              </h3>
            </div>
            {/* <div className="hidden laptop:flex items-center self-end">
              <WebSection.ActionLink
                href={`/artists/${portfolio.artist.username}/portfolios`}
                className="bg-bg/10 backdrop-blur-sm text-end text-lg!"
              >
                {t("exploreMore")}
              </WebSection.ActionLink>
            </div> */}
          </div>

          <div className=" flex flex-col m-auto overflow-hidden size-full">
            <GalleryProvider
              labels={await getGalleryLabels()}
              items={mediaItems.map((m) => ({
                url: m.url ?? m.thumbnail,
                alt: m.seo_alt ?? m.title ?? undefined,
              }))}
            >
              <Gallery />
              <PortfolioGrid
                layout={portfolio.layout}
                portfolioItems={portfolioItems}
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
        <WebSection.NextSectionLink
          href="#landing-cta-section"
          ariaLabel={t("scrollToNextSection")}
        />
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
