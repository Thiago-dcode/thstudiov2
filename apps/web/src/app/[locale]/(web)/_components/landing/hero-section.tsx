import { LazyVideo } from "@repo/ui/components/custom/LazyVideo";
import { SlotMachine } from "@repo/ui/components/custom/slot-machine";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { WebSection } from "./web-section";

// The video and the copy share the first screen (`--hero-h`, set on the section). The video takes
// most of the spare height (grow 4:1) up to its design proportion; what's left past that cap goes
// to the copy as breathing room. On a short screen the video gives up height instead — down to a
// floor, past which the section grows — so the headline and the call to action never get clipped.
const HERO_VIDEO_CLASS =
  "z-0 w-full grow-[4] basis-0 object-cover min-h-[calc(var(--hero-h)*0.25)] max-h-[calc(var(--hero-h)*0.4)] desktop:max-h-[calc(var(--hero-h)*0.5)] desktop-lg:max-h-[calc(var(--hero-h)*0.6)]";

function HeroVideoFallback() {
  return (
    <div aria-hidden="true" className={`${HERO_VIDEO_CLASS} bg-bg-dark`} />
  );
}

function HeroVideo() {
  return (
    <LazyVideo
      src={"https://cdn.a11studio.com/assets/hero-drone-video"}
      poster="https://cdn.a11studio.com/assets/hero-drone-video-thumbnail"
      className={HERO_VIDEO_CLASS}
    />
  );
}

export async function HeroSection() {
  const t = await getTranslations("landing.hero");
  const accentWords = t.raw("titleAccentWords") as string[];
  const discoverWords = t.raw("titleDiscoverWords") as string[];

  return (
    <WebSection
      id="home-hero-section"
      aria-labelledby="hero-heading"
      className="flex flex-col w-full items-center justify-start overflow-hidden bg-bg [--hero-h:calc(100svh-4rem)] min-h-(--hero-h) max-w-(--breakpoint-ultrawide) mx-auto"
    >
      <Suspense fallback={<HeroVideoFallback />}>
        <HeroVideo />
      </Suspense>

      {/* ── Content ──
          Three groups — headline copy, call to action, next-section arrow — spaced evenly
          (`justify-evenly`), so any spare height is shared between them instead of pooling in one
          gap, and the arrow sits at the same distance from the form as the form from the copy. */}
      <div className="z-10 mx-auto flex w-full grow flex-col justify-evenly gap-6 tablet:gap-8 px-2 py-4">
        <div className="flex flex-col items-start w-full">
          {/* The document's h1 is a plain sentence. The animated headline below renders every
              reel word several times over (the slot-machine strip), so as the h1 it read to
              crawlers as "Let your artvisioncraftpassionvoiceartvision…". The visual headline is
              kept identical but demoted to aria-hidden presentation; `sr-only` is the standard
              accessible-heading pattern, not hidden keyword text — it says what the art says. */}
          <h1 id="hero-heading" className="sr-only">
            {t("srTitle")}
          </h1>
          <p
            aria-hidden="true"
            className="uppercase hero-stagger-1 font-serif! font-normal! leading-tight! tracking-tight text-5xl! laptop:text-6xl! desktop-lg:text-8xl! text-left"
          >
            {t("titlePrefix")}{" "}
            <SlotMachine
              texts={accentWords}
              itemHeight="1.2em"
              interval={3000}
              fitWidth
              spinDuration={2500}
              className="text-accent translate-y-[-0.09em]"
            />{" "}
            {t("titleConnector")}{" "}
            <SlotMachine
              texts={discoverWords}
              itemHeight="1.2em"
              interval={3200}
              spinDuration={2500}
              fitWidth
              className="translate-y-[-0.09em]"
            />
            .
          </p>

          {/* A hero subtitle is body copy, not a heading — as an <h3> straight after the <h1> it
              skipped a level and put marketing text into the document outline.
              Three tiers, each a clear step down in size and tone so they don't compete:
              headline (full ink) → subtitle (muted, light) → definition (small, dimmest). */}
          <p className="hero-stagger-2 pt-2 laptop:pt-3 font-light! font-sans! text-text-muted text-lg! tablet:text-xl! laptop:text-2xl! leading-snug max-w-3xl text-left">
            {t("subtitle")}
          </p>
          {/* The one plain "what is A11STUDIO" sentence: what Google and answer engines quote when
              someone searches the brand name. Kept quiet visually; the headline does the selling. */}
          {/* <p className="hero-stagger-2 mt-2 font-sans! font-normal! text-text/60 text-sm! leading-relaxed max-w-2xl text-left">
            {t("definition")}
          </p> */}
        </div>

        <div className="hero-stagger-4 flex w-full">
          <RegistrationCtaButton
            size="lg"
            intent="createPortfolio"
            className="w-full phone:w-auto"
          />
        </div>

        {/* In normal flow (not the default absolute bottom overlay): the copy above can run long
            on narrow phones, and an overlaid arrow ended up sitting on top of the call to action. */}
        <WebSection.NextSectionLink
          href="#value-pillars"
          ariaLabel={t("scrollToNextSection")}
          className="static translate-x-0 self-center"
        />
      </div>

      <style>{`
 /* ── Staggered entrance animations ── */
 @media (prefers-reduced-motion: no-preference) {
 .hero-stagger-1,
 .hero-stagger-2,
 .hero-stagger-4 {
 animation: hero-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
 }
 .hero-stagger-1 { animation-delay: 0.1s; }
 .hero-stagger-2 { animation-delay: 0.25s; }
 .hero-stagger-4 { animation-delay: 0.55s; }

 @keyframes hero-enter {
 from {
 opacity: 0;
 transform: translateY(18px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
 }
 }
 `}</style>
    </WebSection>
  );
}
