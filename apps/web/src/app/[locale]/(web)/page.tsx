import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { FaqsContent } from "../../../lib/components/faqs";
import { CtaSection } from "./_components/landing/cta-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { FeaturedPortfolioSection } from "./_components/landing/featured-portfolio-section";
import { HeroSection } from "./_components/landing/hero-section";
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

export default async function Home() {
  const tSeo = await getTranslations("seo");
  return (
    <>
      <JsonLd data={buildOrganizationJsonLd(tSeo("organizationDescription"))} />
      <JsonLd data={buildWebSiteJsonLd()} />
      <HeroSection />
      <ValuePillarsSection />

      {/* <SocialProofSection /> */}
      {/* <FeatureCategoriesSection /> */}
      <FeaturedPortfolioSection />
      {/* <HowItWorksSection /> */}

      <FeaturedArtistsSection />
      <CtaSection />
      <WebSection>
        <WebSection.Container className="max-w-(--breakpoint-laptop) pb-20">
          <FaqsContent />
        </WebSection.Container>
      </WebSection>
    </>
  );
}
