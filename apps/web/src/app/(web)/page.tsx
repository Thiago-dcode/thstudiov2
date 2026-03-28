import { HeroSection } from "./_cpmponents/landing/hero-section";
import { FeaturedArtistsSection } from "./_cpmponents/landing/featured-artists-section";
import { ValuePillarsSection } from "./_cpmponents/landing/value-pillars-section";
import { CtaSection } from "./_cpmponents/landing/cta-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedArtistsSection />
      <ValuePillarsSection />
      <CtaSection />
    </>
  );
}
