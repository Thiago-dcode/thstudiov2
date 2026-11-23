import { getTranslations } from "next-intl/server";
import { FaqsContent } from "@/lib/components/faqs";
import {
  editorialNumber,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

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

export async function FaqsSection({ id, index }: LandingSectionProps) {
  const t = await getTranslations("faqs");
  return (
    <WebSection id={id}>
      {/* Real gutters (the container's default 8px put the answers against the screen edge on
          tablets) and room above, so the FAQ doesn't butt against the CTA section. */}
      <WebSection.Container className="max-w-6xl px-5 pt-12 pb-24 tablet:px-10 tablet:pt-16">
        <FaqsContent
          ids={LANDING_FAQ_IDS}
          variant="editorial"
          header={
            <WebSection.EditorialHeader
              label={t("label")}
              qualifier={index ? editorialNumber(index) : undefined}
              title={t("title")}
            />
          }
        />
      </WebSection.Container>
    </WebSection>
  );
}
