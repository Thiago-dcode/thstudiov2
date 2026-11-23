import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { NextSectionArrow } from "../landing/next-section-arrow";
import {
  FULL_SCREEN_MIN_H,
  type LandingSectionProps,
  WebSection,
} from "../landing/web-section";
import { CtaMicrocopy } from "./cta-microcopy";

/**
 * v2 of the closing invitation: one statement, one line, one button. While registration is closed
 * it names the real waitlist benefit once; nothing here counts down or invents scarcity.
 */
export async function CtaSectionV2({ id, nextSectionId }: LandingSectionProps) {
  const t = await getTranslations("landingV2.cta");
  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;

  return (
    <WebSection
      id={id}
      className={`relative flex ${FULL_SCREEN_MIN_H} items-center justify-center overflow-hidden`}
    >
      <WebSection.Container className="flex max-w-3xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-5">
          <span aria-hidden="true" className="h-px w-12 bg-border-em" />
          <span className="text-xs! font-semibold uppercase tracking-[0.2em] text-text-muted">
            {t("badge")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-4">
          {/* "Be an ~~influencer~~ artist.": the struck word is real text in an <s>, so crawlers and
              screen readers get the whole line, not a gap. */}
          {/* `!` like the other landing headings: the global h2 styles otherwise win and the
              statement rendered at body size on every screen. */}
          <h2 className="max-w-2xl font-serif! text-3xl! font-medium! leading-[1.1]! tracking-tight tablet:text-4xl! laptop:text-5xl!">
            {t.rich("title", {
              strike: (chunks) => (
                <s className="font-normal text-text-muted decoration-accent decoration-[0.08em]">
                  {chunks}
                </s>
              ),
            })}
          </h2>
          <p className="max-w-lg text-base! leading-relaxed text-text-muted tablet:text-lg! tablet:leading-relaxed">
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
