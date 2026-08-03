import { LazyVideo } from "@repo/ui/components/custom/LazyVideo";
import { SlotMachine } from "@repo/ui/components/custom/slot-machine";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import assetService from "@/modules/assets/asset.service";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";
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
  if (!heroVideo.data?.url) return <HeroVideoFallback />;
  return (
    <LazyVideo
      src={heroVideo.data.url}
      poster={heroVideo.data.thumbnail ?? undefined}
      className="justify-self-end inset-0 z-0 object-cover h-3/5 desktop:h-2/5 desktop-lg:h-3/5  w-screen"
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
      className="  flex flex-col w-full items-center justify-start overflow-hidden bg-bg min-h-[calc(100svh-4rem)] laptop:h-[calc(100svh-4rem)]  max-w-(--breakpoint-ultrawide) mx-auto"
    >
      <Suspense fallback={<HeroVideoFallback />}>
        <HeroVideo />
      </Suspense>

      {/* ── Content ── */}
      <div className="max-h-1/2 z-10 mx-auto flex flex-col items-center text-center gap-5 laptop:gap-8 w-full  pt-3 px-2 laptop:px-4">
        <div className="flex flex-col items-start gap-0 w-full">
          <h1 className="uppercase hero-stagger-1 tracking-tight text-shadow-lg text-5xl!  laptop:text-6xl! desktop-lg:text-7xl! text-left font-sans!">
            {t("titlePrefix")}{" "}
            <SlotMachine
              texts={accentWords}
              itemHeight="1.2em"
              interval={2000}
              fitWidth
              spinDuration={1800}
              className="text-accent translate-y-[-0.11em]"
            />{" "}
            {t("titleConnector")}{" "}
            <SlotMachine
              texts={discoverWords}
              itemHeight="1.2em"
              interval={2500}
              spinDuration={1800}
              fitWidth
              className="translate-y-[-0.11em]"
            />
            .
          </h1>

          <h3 className="hero-stagger-2 font-normal!  phone-lg:text-2xl! text-lg! leading-relaxed  font-sans! max-w-5xl text-left">
            {t("subtitle")}
          </h3>
        </div>

        <div className="hero-stagger-4 flex w-full justify-start pt-0 phone:pt-8 tablet:pt-12 laptop:pt-4 ">
          <div className="w-full max-w-3xl">
            <WaitListForm from="hero" />
          </div>
        </div>
      </div>

      <WebSection.NextSectionLink
        href="#value-pillars"
        ariaLabel={t("scrollToNextSection")}
        className="bottom-10"
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
