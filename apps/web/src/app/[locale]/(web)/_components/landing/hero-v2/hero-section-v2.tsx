import { SlotMachine } from "@repo/ui/components/custom/slot-machine";
import { getTranslations } from "next-intl/server";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { WebSection } from "../web-section";
import { RandomGrid } from "./random-grid";
import "./hero-section-v2.css";

// Stacked blur layers, each masked to a smaller ellipse: the blur adds up toward the
// center, behind the copy, and fades out to sharp images at the corners.
const BLUR_LAYERS = [
  {
    className: "backdrop-blur-[1px]",
    mask: "radial-gradient(ellipse 65% 65% at center, black 0%, black 40%, transparent 100%)",
  },
  {
    className: "backdrop-blur-[1.5px]",
    mask: "radial-gradient(ellipse 55% 55% at center, black 0%, black 30%, transparent 100%)",
  },
  {
    className: "backdrop-blur-[2px]",
    mask: "radial-gradient(ellipse 40% 40% at center, black 0%, black 25%, transparent 100%)",
  },
];

export const HeroSectionV2 = async () => {
  const t = await getTranslations("landing.hero");
  const accentWords = t.raw("titleAccentWords") as string[];
  const discoverWords = t.raw("titleDiscoverWords") as string[];

  return (
    <WebSection
      id="home-hero-section"
      className="mx-auto flex h-[calc(100svh-4rem)] w-full max-w-(--breakpoint-ultrawide) flex-col"
    >
      <RandomGrid className="flex-1" />

      {BLUR_LAYERS.map((layer) => (
        <div
          key={layer.className}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-5 ${layer.className}`}
          style={{ maskImage: layer.mask, WebkitMaskImage: layer.mask }}
        />
      ))}
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
            className="hero-stagger-1 font-serif! font-normal! uppercase leading-[1.05]! tracking-tight text-text text-5xl! tablet:text-6xl! laptop:text-7xl! desktop-lg:text-8xl!"
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
          <p className="hero-stagger-2 max-w-xl font-sans! font-light! leading-relaxed text-text-muted text-base! tablet:text-lg! laptop:text-xl!">
            {t("subtitle")}
          </p>
        </div>

        <div className="hero-stagger-4">
          <RegistrationCtaButton size="lg" intent="createPortfolio" />
        </div>
      </div>
    </WebSection>
  );
};
