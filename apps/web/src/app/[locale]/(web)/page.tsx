import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ComponentType } from "react";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import { buildHomeJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { FaqsContent } from "../../../lib/components/faqs";
import { CtaSection } from "./_components/landing/cta-section";
import { DisciplineLandingsSection } from "./_components/landing/discipline-landings-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { FeaturedPortfolioSection } from "./_components/landing/featured-portfolio-section";
import { HeroSectionV2 } from "./_components/landing/hero-v2/hero-section-v2";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import {
  type LandingSectionProps,
  WebSection,
} from "./_components/landing/web-section";

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
  { id: "disciplines", Component: DisciplineLandingsSection },
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
  const [tSeo, directoryOpen] = await Promise.all([
    getTranslations("seo"),
    isDirectoryOpen(),
  ]);
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
      {SECTIONS.map(({ id, Component }, index) => (
        <Component key={id} id={id} nextSectionId={SECTIONS[index + 1]?.id} />
      ))}
    </>
  );
}
