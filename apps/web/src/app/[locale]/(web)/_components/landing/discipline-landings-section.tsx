import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  DISCIPLINE_LANDING_KEYS,
  disciplineLandingPath,
} from "@/modules/landings/discipline-landings";
import { NextSectionArrow } from "./next-section-arrow";
import {
  FULL_SCREEN_MIN_H,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

/**
 * Links from the homepage body into every discipline landing (`/for/photographers`, …). The footer
 * link alone passes little weight; a contextual link with descriptive anchor text from the most
 * linked page on the site is what tells search engines the landing matters.
 *
 * Centred like the hero above and the CTA section, so it reads as balanced at any width.
 */
export async function DisciplineLandingsSection({
  id,
  nextSectionId,
}: LandingSectionProps) {
  const t = await getTranslations("landing.disciplines");

  return (
    <WebSection
      id={id}
      className={`flex ${FULL_SCREEN_MIN_H} flex-col justify-center`}
    >
      {/* Full screen, centred: the arrows land on it like every other section. */}
      <WebSection.Container className="flex max-w-3xl flex-col items-center gap-16 px-6 py-20 text-center tablet:px-10">
        {/* `!` throughout: globals.css styles bare h2/p outside any layer, so plain utilities lose. */}
        <div className="flex flex-col items-center gap-5">
          <span aria-hidden="true" className="h-px w-12 bg-border-em" />
          <p className="text-xs! font-semibold uppercase tracking-[0.2em] text-text-muted">
            {t("heading")}
          </p>
        </div>
        {DISCIPLINE_LANDING_KEYS.map((key) => (
          <Link
            key={key}
            href={disciplineLandingPath(key)}
            className="group flex flex-col items-center gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/25 focus-visible:ring-offset-8 focus-visible:ring-offset-bg"
          >
            <h2 className="max-w-2xl text-4xl! leading-[1.05]! tracking-tight text-text tablet:text-6xl!">
              {t(`items.${key}.title`)}
            </h2>
            <p className="max-w-lg text-base! leading-relaxed text-text-muted tablet:text-lg!">
              {t(`items.${key}.description`)}
            </p>
            <span className="inline-flex min-h-11 items-center gap-2 text-base font-medium tracking-wider text-text underline-offset-4 transition-colors group-hover:underline">
              {t(`items.${key}.cta`)}
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        ))}
      </WebSection.Container>
      <NextSectionArrow nextSectionId={nextSectionId} />
    </WebSection>
  );
}
