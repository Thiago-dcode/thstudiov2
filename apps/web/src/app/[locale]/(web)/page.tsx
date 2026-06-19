import WaitListService from "@/modules/wait-list/wait-list.service";
import { FaqsContent } from "../../../lib/components/faqs";
import { CtaSection } from "./_components/landing/cta-section";
import { FeatureCategoriesSection } from "./_components/landing/feature-categories-section";
import { FeaturedArtistsSection } from "./_components/landing/featured-artists-section";
import { HeroSection } from "./_components/landing/hero-section";
import { SocialProofSection } from "./_components/landing/social-proof-section";
import { ValuePillarsSection } from "./_components/landing/value-pillars-section";
import { WebSection } from "./_components/landing/web-section";

export default async function Home() {
  const waitListPosition = await WaitListService.getCurrentPosition();
  const currentWaitListPosition = waitListPosition.data?.position ?? null;

  return (
    <>
      <HeroSection currentWaitListPosition={currentWaitListPosition} />
      <ValuePillarsSection />
      <SocialProofSection />
      <FeatureCategoriesSection />
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
