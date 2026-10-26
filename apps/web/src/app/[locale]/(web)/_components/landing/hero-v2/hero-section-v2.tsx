import { SlotMachine } from "@repo/ui/components/custom/slot-machine";
import { getTranslations } from "next-intl/server";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { NextSectionArrow } from "../next-section-arrow";
import {
  FULL_SCREEN_H,
  type LandingSectionProps,
  WebSection,
} from "../web-section";
import { RandomGrid } from "./random-grid";
import "./hero-section-v2.css";

// One full-viewport backdrop-filter instead of three stacked layers: the extra compositor
// work was paid on the first paint, and the colour wash below already fades the centre.
// Mask keeps the corners sharp; 4px is roughly the stacked 1 + 1.5 + 2px at the centre.
const HERO_BLUR_MASK =
  "radial-gradient(ellipse 65% 65% at center, black 0%, black 30%, transparent 100%)";

export const HeroSectionV2 = async ({
  id,
  nextSectionId,
}: LandingSectionProps) => {
  const t = await getTranslations("landing.hero");
  const accentWords = t.raw("titleAccentWords") as string[];
  const discoverWords = t.raw("titleDiscoverWords") as string[];

  return (
    <WebSection
      id={id}
      className={`mx-auto flex ${FULL_SCREEN_H} w-full max-w-(--breakpoint-ultrawide) flex-col`}
    >
      <RandomGrid className="flex-1" />
      {/* Keeps the grid off the bottom strip, so the next-section arrow sits on plain background
          instead of on top of a photo, where it was hard to see and easy to miss. */}
      <div aria-hidden="true" className="h-20 shrink-0" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-5 backdrop-blur-xs"
        style={{
          maskImage: HERO_BLUR_MASK,
          WebkitMaskImage: HERO_BLUR_MASK,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-5"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at center, color-mix(in oklab, var(--color-bg) 75%, transparent) 0%, color-mix(in oklab, var(--color-bg) 35%, transparent) 55%, transparent 100%)",
        }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-6 text-center tablet:gap-10">
        {/* The animated headline repeats every reel word, so the real h1 is a plain sentence. */}
        <h1 className="sr-only">{t("srTitle")}</h1>

        <div className="flex max-w-5xl flex-col items-center gap-4 tablet:gap-6">
          <p
            aria-hidden="true"
            className="hero-stagger-1 font-serif! font-medium! uppercase leading-[1.05]! tracking-tight text-text text-5xl! tablet:text-6xl! laptop:text-7xl! desktop-lg:text-9xl!"
          >
            <span className="block tablet:whitespace-nowrap">
              {t("titlePrefix")}{" "}
              <SlotMachine
                texts={accentWords}
                itemHeight="1.2em"
                interval={3000}
                fitWidth
                spinDuration={2500}
                className="text-accent translate-y-[-0.09em]"
              />{" "}
              {t("titleConnector")}
            </span>
            <span className="block">
              <SlotMachine
                texts={discoverWords}
                itemHeight="1.2em"
                interval={3200}
                spinDuration={2500}
                fitWidth
                className="translate-y-[-0.09em]"
              />
              .
            </span>
          </p>
          <p className="hero-stagger-2 max-w-2xl font-normal! leading-relaxed text-text-muted text-base! tablet:text-xl! laptop:text-2xl!">
            {t("subtitle")}
          </p>
        </div>

        <div className="hero-stagger-4">
          <RegistrationCtaButton size="lg" intent="createPortfolio" />
        </div>
      </div>
      <NextSectionArrow nextSectionId={nextSectionId} />
    </WebSection>
  );
};
