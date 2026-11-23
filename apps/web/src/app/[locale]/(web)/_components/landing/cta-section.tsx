import {
  EditorialRule,
  editorialHeadlineClass,
} from "@repo/ui/components/custom/editorial";
import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { CtaMicrocopy } from "./cta-microcopy";
import { NextSectionArrow } from "./next-section-arrow";
import {
  editorialNumber,
  FULL_SCREEN_MIN_H,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

/**
 * The closing invitation: one statement, one line, one button. While registration is closed
 * it names the real waitlist benefit once; nothing here counts down or invents scarcity.
 */
export async function CtaSection({
  id,
  nextSectionId,
  index,
}: LandingSectionProps) {
  const t = await getTranslations("landing.cta");
  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  return (
    <WebSection
      id={id}
      className={`relative flex ${FULL_SCREEN_MIN_H} items-center justify-center overflow-hidden`}
    >
      <WebSection.Container className="flex max-w-4xl flex-col items-center gap-12 px-5 py-24 text-center tablet:px-10">
        <div className="flex flex-col items-center gap-6">
          <EditorialRule />
          <WebSection.Label
            qualifier={index ? editorialNumber(index) : undefined}
          >
            {t("badge")}
          </WebSection.Label>
        </div>
        <div className="flex flex-col items-center gap-6">
          {/* "Be an ~~influencer~~ artist.": the struck word is real text in an <s>, so crawlers and
              screen readers get the whole line, not a gap. */}
          {/* `!` like the other landing headings: the global h2 styles otherwise win and the
              statement rendered at body size on every screen. */}
          <h2 className={`max-w-3xl ${editorialHeadlineClass("section")}`}>
            {t.rich("title", {
              strike: (chunks) => (
                <s className="font-normal italic text-text-muted decoration-accent decoration-[0.06em]">
                  {chunks}
                </s>
              ),
            })}
          </h2>
          <p className="max-w-lg font-serif! text-lg! italic leading-relaxed text-text-muted tablet:text-xl!">
            {t("description")}
          </p>
          {registrationIsClosed ? (
            <p className="max-w-lg text-sm! leading-relaxed text-text-muted">
              {t("earlyAccessNote")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-4">
          <RegistrationCtaButton intent="createPortfolio" size="lg" />
          <CtaMicrocopy />
        </div>
      </WebSection.Container>
      <NextSectionArrow nextSectionId={nextSectionId} />
    </WebSection>
  );
}
