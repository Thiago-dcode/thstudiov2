import { FaqsContent } from "../../../lib/components/faqs";
import { CtaSection } from "./_components/landing/cta-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { FeaturedPortfolioSection } from "./_components/landing/featured-portfolio-section";
import { HeroSection } from "./_components/landing/hero-section";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import { WebSection } from "./_components/landing/web-section";

export default async function Home() {
  return (
    <>
      <HeroSection />
      <ValuePillarsSection />

      {/* <SocialProofSection /> */}
      {/* <FeatureCategoriesSection /> */}
      <FeaturedPortfolioSection />
      {/* <HowItWorksSection /> */}

      <FeaturedArtistsSection />
      <CtaSection />
      <WebSection>
        <WebSection.Container>
          <FaqsContent />
        </WebSection.Container>
      </WebSection>
    </>
  );
}
