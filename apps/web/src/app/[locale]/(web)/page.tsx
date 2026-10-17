import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildHomeJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { FaqsContent } from "../../../lib/components/faqs";
import { CtaSection } from "./_components/landing/cta-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { FeaturedPortfolioSection } from "./_components/landing/featured-portfolio-section";
import { HeroSectionV2 } from "./_components/landing/hero-v2/hero-section-v2";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import { WebSection } from "./_components/landing/web-section";

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
  const tSeo = await getTranslations("seo");
  return (
    <>
      {/* One connected graph: the brand, the site and this page (they were two unrelated scripts). */}
      <JsonLd
        data={buildHomeJsonLd(locale, {
          description: tSeo("organizationDescription"),
          founderRole: tSeo("founderRole"),
          pageName: tSeo("homePageName"),
        })}
      />
      {/* <HeroSection /> */}

      <HeroSectionV2 />
      <ValuePillarsSection />
      {/* <SocialProofSection /> */}
      {/* <FeatureCategoriesSection /> */}
      <FeaturedPortfolioSection />
      {/* <HowItWorksSection /> */}

      <FeaturedArtistsSection />
      <CtaSection />
      <WebSection>
        <WebSection.Container className="max-w-(--breakpoint-laptop) pb-20">
          <FaqsContent limit={4} />
        </WebSection.Container>
      </WebSection>
    </>
  );
}
