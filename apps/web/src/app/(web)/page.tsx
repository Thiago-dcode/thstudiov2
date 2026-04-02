import { HeroSection } from "./_cpmponents/landing/hero-section";
import { FeaturedArtistsSection } from "./_cpmponents/landing/featured-artists-section";
import { ValuePillarsSection } from "./_cpmponents/landing/value-pillars-section";
import { CtaSection } from "./_cpmponents/landing/cta-section";
import { FeatureCategoriesSection } from "./_cpmponents/landing/feature-categories-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureCategoriesSection />
      <FeaturedArtistsSection />
      <ValuePillarsSection />
      <CtaSection />
    </>
  );
}
