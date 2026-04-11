import { HeroSection } from "./_components/landing/hero-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import { CtaSection } from "./_components/landing/cta-section";
import { FeatureCategoriesSection } from "./_components/landing/feature-categories-section";
import { HowItWorksSection } from "./_components/landing/how-it-works-section";
import { SocialProofSection } from "./_components/landing/social-proof-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ValuePillarsSection />
      <SocialProofSection />
      <FeatureCategoriesSection />
      <HowItWorksSection />
      <FeaturedArtistsSection />
      <CtaSection />
    </>
  );
}
