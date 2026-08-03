import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { WebSection } from "./web-section";

export async function FeaturedPortfolioSection() {
  const t = await getTranslations("landing.featuredPortfolio");
  const portfolioResponse = await portfolioService.getFeatured();
  const portfolio = portfolioResponse.data;

  if (!portfolio) return null;

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio);
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);

  if (!portfolioItems.length) return null;

  return (
    <WebSection
      id="featured-portfolio"
      className="overflow-hidden max-w-(--breakpoint-ultrawide) max-h-screen mx-auto"
    >
      <WebSection.Container className="pt-24">
        <div className="flex w-full flex-col laptop:flex-row gap-8">
          <div className="flex flex-col  gap-8 laptop:max-w-1/3">
            <div className="flex flex-col items-start justify-start gap-2">
              <h2 className="line-clamp-2 laptop:line-clamp-1">
                {portfolio.title}
              </h2>
              <p className=" line-clamp-3 laptop:line-clamp-none">
                {portfolio.description}
              </p>
            </div>

            <div className="hidden laptop:flex items-center">
              <WebSection.ActionLink
                href={`/artists/${portfolio.artist.username}/portfolios`}
                className="bg-bg/10 backdrop-blur-sm"
              >
                {t("exploreMore")}
              </WebSection.ActionLink>
            </div>
          </div>
          <div className=" m-auto overflow-hidden size-full max-w-(--breakpoint-laptop)">
            <GalleryProvider
              items={mediaItems.map((m) => ({
                url: m.url ?? m.thumbnail,
                alt: m.seo_alt ?? m.title ?? undefined,
              }))}
            >
              <h4 className="text-end pb-1 mr-1">
                A portfolio by:{" "}
                <Link
                  href={`artists/${portfolio.artist.username}`}
                  className="font-medium"
                >
                  {portfolio.artist.username}
                </Link>
              </h4>
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
