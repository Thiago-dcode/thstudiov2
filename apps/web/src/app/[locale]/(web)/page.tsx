import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ComponentType } from "react";
import { serverEnv } from "@/env/server";
import { routing } from "@/i18n/routing";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import { buildHomeJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { FaqsContent } from "../../../lib/components/faqs";
import { CtaSection } from "./_components/landing/cta-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { FeaturedPortfolioSection } from "./_components/landing/featured-portfolio-section";
import { HeroSectionV2 } from "./_components/landing/hero-v2/hero-section-v2";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import {
  type LandingSectionProps,
  WebSection,
} from "./_components/landing/web-section";
import { CtaSectionV2 } from "./_components/landing-v2/cta-section-v2";
import { FeaturedPortfolioSectionV2 } from "./_components/landing-v2/featured-portfolio-section-v2";
import { FirstMinutesSection } from "./_components/landing-v2/first-minutes-section";
import {
  FaqsSectionV2,
  HeroSectionLandingV2,
  ValuePillarsSectionV2,
} from "./_components/landing-v2/landing-v2-sections";

function FaqsSection({ id }: LandingSectionProps) {
  return (
    <WebSection id={id}>
      <WebSection.Container className="max-w-(--breakpoint-laptop) pb-20">
        <FaqsContent limit={4} />
      </WebSection.Container>
    </WebSection>
  );
}

/**
 * The homepage, top to bottom. Each section gets its own anchor id and the next one's, so the
 * "scroll to next section" arrows always follow this order. Reorder here, nowhere else.
 */
const SECTIONS: {
  id: string;
  Component: ComponentType<LandingSectionProps>;
}[] = [
  { id: "home-hero-section", Component: HeroSectionV2 },
  // { id: "disciplines", Component: DisciplineLandingsSection },
  { id: "value-pillars", Component: ValuePillarsSection },
  { id: "featured-portfolio", Component: FeaturedPortfolioSection },
  { id: "featured-artists", Component: FeaturedArtistsSection },
  { id: "landing-cta-section", Component: CtaSection },
  { id: "landing-faqs", Component: FaqsSection },
];

/**
 * The v2 homepage, being validated before it replaces `SECTIONS`. Rendered only when the server
 * env `LANDING_V2=1`; production stays on v1 until that flips. Same rules: order lives here.
 */
const SECTIONS_V2: typeof SECTIONS = [
  { id: "home-hero-section", Component: HeroSectionLandingV2 },
  { id: "first-15-minutes", Component: FirstMinutesSection },
  { id: "value-pillars", Component: ValuePillarsSectionV2 },
  { id: "featured-portfolio", Component: FeaturedPortfolioSectionV2 },
  { id: "featured-artists", Component: FeaturedArtistsSection },
  { id: "landing-cta-section", Component: CtaSectionV2 },
  { id: "landing-faqs", Component: FaqsSectionV2 },
];

const isLandingV2 = () => serverEnv.LANDING_V2 === 1;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // See `Home`: deciding it here, before the first byte, makes it a real 404.
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations(
    isLandingV2() ? "landingV2.metadata" : "landing.metadata",
  );
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
  const v2 = isLandingV2();
  const sections = v2 ? SECTIONS_V2 : SECTIONS;
  const rendered = sections.map(({ id, Component }, index) => (
    <Component key={id} id={id} nextSectionId={sections[index + 1]?.id} />
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
      {v2 ? (
        // v2 lets the sections breathe: a wide gap between each (a section that renders nothing
        // leaves no gap). v1 keeps its original spacing.
        <div className="flex flex-col gap-24 tablet:gap-32 laptop:gap-40">
          {rendered}
        </div>
      ) : (
        rendered
      )}
    </>
  );
}
