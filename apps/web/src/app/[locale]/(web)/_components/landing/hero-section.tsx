import { LazyVideo } from "@repo/ui/components/custom/LazyVideo";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import assetService from "@/modules/assets/asset.service";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";

async function HeroVideo() {
  const heroVideo = await assetService.getBySlug("hero-drone-video");
  if (!heroVideo.data?.url) return null;
  return (
    <LazyVideo
      src={heroVideo.data.url}
      poster={heroVideo.data.thumbnail ?? undefined}
    />
  );
}

export async function HeroSection() {
  const t = await getTranslations("landing.hero");

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex w-full items-center justify-center overflow-hidden bg-bg h-[calc(100svh-4rem)] min-h-136"
    >
      <Suspense fallback={null}>
        <HeroVideo />
      </Suspense>

      <div aria-hidden="true" className="hero-overlay absolute inset-0 z-1" />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex w-full flex-col items-center text-center gap-8 laptop:gap-18 tablet:px-10 tablet:py-24 px-4">
        {/* <span className="hero-stagger-1 inline-flex items-center gap-2 border border-border/40 bg-fg/50 px-4 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-text-muted backdrop-blur-md max-w-fit">
          <Sparkle className="size-3 text-text-muted" aria-hidden="true" />
          {t("disclaimer")}
        </span> */}
        <div className="flex flex-col w-full items-center gap-5">
          <h1
            id="hero-heading"
            className="hero-title hero-stagger-2 text-white! tracking-tight text-shadow-lg text-6xl! tablet-lg:text-8xl!"
          >
            {t("titlePrefix")}{" "}
            <span className="text-fire text-shadow-none">
              {t("titleAccent")}
            </span>{" "}
            {t("titleSuffix")}
          </h1>

          <h3 className="font-normal! laptop:text-2xl! text-xl! leading-relaxed text-white/90! font-sans! ">
            {t("subtitle")}
          </h3>
        </div>

        <div className="hero-stagger-4 flex w-full justify-center pt-4 tablet:pt-6">
          <div className="w-full max-w-4xl">
            <WaitListForm from="hero" />
          </div>
        </div>
      </div>

      {/* ── Scroll down indicator ── */}
      <a
        href="#value-pillars"
        aria-label="Scroll to next section"
        className="hero-stagger-4 absolute bottom-6 left-1/2 z-10 -translate-x-1/2 p-2 text-text-muted/50 transition-colors hover:text-text focus-visible:text-text"
      >
        <ChevronDown
          className="size-5 hero-bounce text-white/80!"
          aria-hidden="true"
        />
      </a>

      <style>{`
 /* ── Headline: fluid type that scales without overflow ── */
 .hero-title {
 font-size: clamp(3rem, 7vw + 1rem, 6.5rem);
 line-height: 0.95;
 }

 .hero-overlay {
 background:
 linear-gradient(
 to bottom,
 color-mix(in oklab, var(--color-bg-dark) 82%, transparent),
 transparent 38%
 ),
 linear-gradient(
 to top,
 color-mix(in oklab, var(--color-bg-dark) 75%, transparent),
 transparent 42%
 );
 }

        /* ── Accent emphasis text (isolated punchy word) ── */
        .hero-accent-text {
          display: inline-block;
          padding-inline: 0.15em;
          color: var(--color-accent);
        }

 /* ── Staggered entrance animations ── */
 @media (prefers-reduced-motion: no-preference) {
 .hero-stagger-1,
 .hero-stagger-2,
 .hero-stagger-3,
 .hero-stagger-4 {
 animation: hero-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
 }
 .hero-stagger-1 { animation-delay: 0.1s; }
 .hero-stagger-2 { animation-delay: 0.25s; }
 .hero-stagger-3 { animation-delay: 0.4s; }
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
    </section>
  );
}
