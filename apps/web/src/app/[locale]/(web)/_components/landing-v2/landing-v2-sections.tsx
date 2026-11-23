import { getTranslations } from "next-intl/server";
import { FaqsContent } from "@/lib/components/faqs";
import { HeroSectionV2 } from "../landing/hero-v2/hero-section-v2";
import { ValuePillarsSection } from "../landing/value-pillars-section";
import { type LandingSectionProps, WebSection } from "../landing/web-section";
import { CtaMicrocopy } from "./cta-microcopy";

/** The v1 hero (grid, reels, CTA) with the v2 subtitle and the quiet line under the button. */
export async function HeroSectionLandingV2(props: LandingSectionProps) {
  const t = await getTranslations("landingV2.hero");
  return (
    <HeroSectionV2
      {...props}
      subtitle={t("subtitle")}
      footnote={<CtaMicrocopy />}
    />
  );
}

/** The v1 value pillars with v2 copy (two lines rewritten to what the product does today). */
export function ValuePillarsSectionV2(props: LandingSectionProps) {
  return <ValuePillarsSection {...props} namespace="landingV2.valuePillars" />;
}

/**
 * Questions photographers actually ask before trusting a portfolio platform. How to sign up is not
 * one of them. Ids point into the shared `faqs.items`.
 */
const LANDING_FAQ_IDS = [
  "what-is-a11studio",
  "vs-social-media-website-builder",
  "is-free",
  "why-ai",
  "google-visibility",
  "ownership",
] as const;

export function FaqsSectionV2({ id }: LandingSectionProps) {
  return (
    <WebSection id={id}>
      {/* Real gutters (the container's default 8px put the answers against the screen edge on
          tablets) and room above, so the FAQ doesn't butt against the CTA section. */}
      <WebSection.Container className="max-w-(--breakpoint-laptop) px-5 pt-12 pb-20 tablet:px-8 tablet:pt-16">
        <FaqsContent ids={LANDING_FAQ_IDS} />
      </WebSection.Container>
    </WebSection>
  );
}
