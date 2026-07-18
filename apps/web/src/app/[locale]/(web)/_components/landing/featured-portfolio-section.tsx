import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { WebSection } from "./web-section";

const MAX_FEATURED_ITEMS = 15;
const PHONE_FEATURED_COUNT = 7;
const TABLET_FEATURED_COUNT = 11;
const LAPTOP_FEATURED_COUNT = 13;

export async function FeaturedPortfolioSection() {
  const t = await getTranslations("landing.featuredPortfolio");
  const portfolioResponse = await portfolioService.getFeatured();
  const portfolio = portfolioResponse.data;

  if (!portfolio) return null;

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio).slice(
    0,
    MAX_FEATURED_ITEMS,
  );
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);

  if (!portfolioItems.length) return null;

  const sliceFeaturedItems = (count: number) =>
    portfolioItems.slice(0, Math.min(portfolioItems.length, count));

  return (
    <WebSection className="overflow-hidden">
      <WebSection.Container>
        <WebSection.Header
          badge={t("header.badge")}
          title={portfolio.title}
          description={t("header.description")}
        />
        <section className=" relative m-auto">
          {/* <PortfolioCard.Item className="tablet:hidden" portfolio={portfolio} /> */}
          <p className=" mb-2 text-sm text-text-muted">
            {t("by")}{" "}
            <Link
              href={`/artists/${portfolio.artist.username}`}
              className="font-medium text-text underline-offset-4 transition-colors hover:text-text-muted hover:underline"
              aria-label={t("viewProfile", {
                username: portfolio.artist.username,
              })}
            >
              @{portfolio.artist.username}
            </Link>
          </p>
          <GalleryProvider
            items={mediaItems.map((m) => ({
              url: m.url ?? m.thumbnail,
              alt: m.seo_alt ?? m.title ?? undefined,
            }))}
          >
            <div className="tablet:hidden">
              <PortfolioGrid
                portfolioItems={sliceFeaturedItems(PHONE_FEATURED_COUNT)}
              />
            </div>
            <div className="hidden tablet:block laptop:hidden">
              <PortfolioGrid
                portfolioItems={sliceFeaturedItems(TABLET_FEATURED_COUNT)}
              />
            </div>
            <div className="hidden laptop:block desktop:hidden">
              <PortfolioGrid
                portfolioItems={sliceFeaturedItems(LAPTOP_FEATURED_COUNT)}
              />
            </div>
            <div className="hidden desktop:block">
              <PortfolioGrid portfolioItems={portfolioItems} />
            </div>
            <div className="tablet:block">
              <Gallery />
            </div>
          </GalleryProvider>

          <div className="absolute inset-x-0 bottom-0 z-10">
            <div
              className="featured-portfolio-fade pointer-events-none"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-12 tablet:bottom-16 flex justify-center">
              <WebSection.ActionLink
                href={`/artists/${portfolio.artist.username}/portfolios`}
                className="relative z-20 bg-bg/10 px-4 py-2 backdrop-blur-sm"
              >
                {t("exploreMore")}
              </WebSection.ActionLink>
            </div>
          </div>
        </section>
      </WebSection.Container>

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
