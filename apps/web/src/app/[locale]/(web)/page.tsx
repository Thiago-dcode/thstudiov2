import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ComponentType } from "react";
import { routing } from "@/i18n/routing";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import { buildHomeJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { CtaSection } from "./_components/landing/cta-section";
import { FaqsSection } from "./_components/landing/faqs-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { FeaturedPortfolioSection } from "./_components/landing/featured-portfolio-section";
import { FirstMinutesSection } from "./_components/landing/first-minutes-section";
import { HeroSection } from "./_components/landing/hero/hero-section";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import type { LandingSectionProps } from "./_components/landing/web-section";

/**
 * The homepage, top to bottom. Each section gets its own anchor id and the next one's, so the
 * "scroll to next section" arrows always follow this order, and its position, for the editorial
 * `SECTION / 001` labels. Reorder here, nowhere else.
 */
const SECTIONS: {
  id: string;
  Component: ComponentType<LandingSectionProps>;
}[] = [
  { id: "home-hero-section", Component: HeroSection },
  { id: "first-15-minutes", Component: FirstMinutesSection },
  { id: "value-pillars", Component: ValuePillarsSection },
  { id: "featured-portfolio", Component: FeaturedPortfolioSection },
  { id: "featured-artists", Component: FeaturedArtistsSection },
  { id: "landing-cta-section", Component: CtaSection },
  { id: "landing-faqs", Component: FaqsSection },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // See `Home`: deciding it here, before the first byte, makes it a real 404.
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("landing.metadata");
  return buildStaticPageMetadata({
    path: "/",
    title: t("title"),
    titleAbsolute: true,
    description: t("description"),
    locale,
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Dotted single-segment paths (`/.env`, `/ngsw.json`) skip the locale proxy and land here as the
  // locale. The layout 404s them too, but Next renders this page in parallel with it, so without
  // this guard every scanner probe fetched the landing sections — and on a cache expiry those
  // concurrent fetches exhausted the API's database pool.
  if (!hasLocale(routing.locales, locale)) notFound();
  const [tSeo, directoryOpen] = await Promise.all([
    getTranslations("seo"),
    isDirectoryOpen(),
  ]);
  const rendered = SECTIONS.map(({ id, Component }, index) => (
    <Component
      key={id}
      id={id}
      index={index}
      nextSectionId={SECTIONS[index + 1]?.id}
    />
  ));
  return (
    <>
      {/* One connected graph: the brand, the site and this page (they were two unrelated scripts). */}
      <JsonLd
        data={buildHomeJsonLd(
          locale,
          {
            description: tSeo("organizationDescription"),
            founderRole: tSeo("founderRole"),
            pageName: tSeo("homePageName"),
          },
          { directoryOpen },
        )}
      />
      {/* The sections breathe: a wide gap between each (a section that renders nothing leaves no
          gap). */}
      <div className="flex flex-col gap-24 tablet:gap-32 laptop:gap-40">
        {rendered}
      </div>
    </>
  );
}
