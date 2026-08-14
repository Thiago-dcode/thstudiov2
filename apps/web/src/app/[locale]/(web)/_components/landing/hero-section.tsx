import { LazyVideo } from "@repo/ui/components/custom/LazyVideo";
import { SlotMachine } from "@repo/ui/components/custom/slot-machine";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import assetService from "@/modules/assets/asset.service";
import {
  WaitListForm,
  WaitListHint,
} from "@/modules/wait-list/components/wait-list-form";
import { reportSectionError } from "./section-error";
import { WebSection } from "./web-section";

function HeroVideoFallback() {
  return (
    <div
      aria-hidden="true"
      className="justify-self-end inset-0 z-0 object-cover max-h-3/5 w-screen bg-bg-dark"
    />
  );
}

async function HeroVideo() {
  const heroVideo = await assetService.getBySlug("hero-drone-video");
  reportSectionError("hero-video", heroVideo);
  if (!heroVideo.data?.url) return <HeroVideoFallback />;
  return (
    <LazyVideo
      src={heroVideo.data.url}
      poster={heroVideo.data.thumbnail ?? undefined}
      className="justify-self-end inset-0 z-0 object-cover h-2/5 desktop:h-6/12 desktop-lg:h-3/5  w-screen"
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
      className="flex flex-col w-full items-center justify-start overflow-hidden bg-bg h-[calc(100svh-4rem)]  max-w-(--breakpoint-ultrawide) mx-auto"
    >
      <Suspense fallback={<HeroVideoFallback />}>
        <HeroVideo />
      </Suspense>

      {/* ── Content ── */}
      <div className="max-h-1/2 z-10 mx-auto flex flex-col text-center justify-start h-full w-full pt-3 px-2">
        <div className="flex flex-col items-start w-full">
          <h1 className="uppercase hero-stagger-1 tracking-tight text-5xl! laptop:text-6xl! desktop-lg:text-8xl! text-left">
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
          </h1>

          {/* A hero subtitle is body copy, not a heading — as an <h3> straight after the <h1> it
              skipped a level and put marketing text into the document outline. */}
          <p className="hero-stagger-2 font-light!  phone-lg:text-3xl! font-sans! text-text-muted text-lg! leading-relaxed max-w-4xl text-left">
            {t("subtitle")}
          </p>
        </div>

        <div className="hero-stagger-4 flex w-full  pt-4 phone-xs:pt-12 desktop-lg:pt-24 ">
          <div className="flex w-full max-w-3xl flex-col ">
            <WaitListHint />
            <WaitListForm />
          </div>
        </div>
      </div>

      <WebSection.NextSectionLink
        href="#value-pillars"
        ariaLabel={t("scrollToNextSection")}
      />

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
