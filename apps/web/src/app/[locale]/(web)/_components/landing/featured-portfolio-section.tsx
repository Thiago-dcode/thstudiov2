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

const MAX_FEATURED_ITEMS = 15;

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

  return (
    <WebSection>
      <WebSection.Container>
        <WebSection.Header
          badge={t("header.badge")}
          title={portfolio.title}
          description={t("header.description")}
        />
        <section className="relative m-auto">
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
            <PortfolioGrid portfolioItems={portfolioItems} />
            <div className="hidden tablet:block">
              <Gallery />
            </div>
          </GalleryProvider>
        </section>
      </WebSection.Container>
    </WebSection>
  );
}
