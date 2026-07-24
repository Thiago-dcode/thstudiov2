import { LazyVideo } from "@repo/ui/components/custom/LazyVideo";
import { SlotMachine } from "@repo/ui/components/custom/slot-machine";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import assetService from "@/modules/assets/asset.service";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";
import { ScrollHashLink } from "./scroll-hash-link";
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
      className="justify-self-end inset-0 z-0 object-cover max-h-full laptop:max-h-3/5  w-screen"
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
      className=" relative flex flex-col w-full items-center justify-start overflow-hidden bg-bg h-[calc(100svh-4rem)] max-w-(--breakpoint-ultrawide) mx-auto"
    >
    <Suspense fallback={<HeroVideoFallback />}>
        <HeroVideo />
      </Suspense>


      {/* ── Content ── */}
      <div className="max-h-1/2 z-10 mx-auto flex flex-col items-center text-center gap-5 laptop:gap-8 w-full  pt-3 px-2 laptop:px-4">

        <div className="flex flex-col items-start gap-2 w-full">
          <h1
            className="uppercase hero-stagger-1 tracking-tight text-shadow-lg text-6xl! phone-lg:6xl!   laptop:text-7xl! desktop-lg:text-7xl! text-left font-sans!"
          >
            {t("titlePrefix")}{" "}
            <SlotMachine
              texts={accentWords}
              itemHeight="1.2em"
              interval={2800}
              fitWidth
              className="text-accent translate-y-[-0.11em]"
            />{" "}
            {t("titleConnector")}{" "}
            <SlotMachine
              texts={discoverWords}
              itemHeight="1.2em"
              interval={3400}
              fitWidth
              className="translate-y-[-0.11em]"
            />.
          </h1>

          <h3 className="hero-stagger-2 font-normal! phone-lg:text-2xl! text-lg! leading-relaxed text-white/90! font-sans! max-w-5xl text-left">
            {t("subtitle")}
          </h3>
        </div>

        <div className="hero-stagger-4 flex w-full justify-start pt-8 phone-lg:pt-4 pb-6">
          <div className="w-full max-w-3xl">
            <WaitListForm from="hero" />
          </div>
        </div>
      </div>
     
      {/* ── Scroll down indicator ── */}
      <ScrollHashLink
        href="#value-pillars"
        aria-label={t("scrollToNextSection")}
        className="z-100 absolute bottom-6 left-1/2 -translate-x-1/2 p-2 text-text-muted/50 transition-colors hover:text-text focus-visible:text-text"
      >
        <ChevronDown
          className="size-5 hero-bounce text-white/80!"
          aria-hidden="true"
        />
      </ScrollHashLink>

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

 .hero-bounce {
 animation: hero-float 2.4s ease-in-out infinite;
 }

 @keyframes hero-float {
 0%, 100% { transform: translateY(0); }
 50% { transform: translateY(5px); }
 }
 }
 `}</style>
    </WebSection>
  );
}
