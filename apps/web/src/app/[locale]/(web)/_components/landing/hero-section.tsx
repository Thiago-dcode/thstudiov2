import { ChevronDown, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { WaitListForm } from "@/modules/wait-list/components/wait-list-form";

type HeroSectionProps = {
 currentWaitListPosition?: number | null;
};

export async function HeroSection({
 currentWaitListPosition,
}: HeroSectionProps) {
 const t = await getTranslations("landing.hero");

 return (
 <section
 aria-labelledby="hero-heading"
 className="relative flex w-full items-center justify-center overflow-hidden bg-bg h-[calc(100svh-4rem)] min-h-136"
 >
 {/* ── Background video (decorative) ── */}
 <video
 src={`${serverEnv.ASSETS_URL}/videos/hero-bg.mp4`}
 autoPlay
 loop
 muted
 playsInline
 preload="auto"
 aria-hidden="true"
 tabIndex={-1}
 className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
 />

 {/* ── Gradient overlays for contrast & brand warmth ── */}
 <div aria-hidden="true" className="hero-overlay absolute inset-0 z-1" />
 <div aria-hidden="true" className="hero-glow absolute inset-0 z-2" />

 {/* ── Content ── */}
 <div className="relative z-10 mx-auto flex w-full flex-col items-center gap-6 px-6 py-16 text-center tablet:gap-8 tablet:px-10 tablet:py-24">
 <span className="hero-stagger-1 inline-flex items-center gap-2 border border-border/40 bg-fg/50 px-4 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-text-muted backdrop-blur-md">
 <Sparkles className="size-3 text-text-muted" aria-hidden="true" />
 {t("disclaimer")}
 </span>

 <h1
 id="hero-heading"
 className="hero-title hero-stagger-2 font-black tracking-tight text-text"
 >
 {t("titlePrefix")}{" "}
 <span className="hero-accent-text italic">{t("titleAccent")}</span>{" "}
 {t("titleSuffix")}
 </h1>

 <p className="hero-stagger-3 max-w-2xl text-xl leading-relaxed text-text-muted">
 {t("subtitle")}
 </p>

 <div className="hero-stagger-4 flex w-full justify-center pt-4 tablet:pt-6">
 <div className="w-full max-w-4xl">
 <WaitListForm currentPosition={currentWaitListPosition} />
 </div>
 </div>
 </div>

 {/* ── Scroll down indicator ── */}
 <a
 href="#value-pillars"
 aria-label="Scroll to next section"
 className="hero-stagger-4 absolute bottom-6 left-1/2 z-10 -translate-x-1/2 p-2 text-text-muted/50 transition-colors hover:text-text focus-visible:text-text"
 >
 <ChevronDown className="size-5 hero-bounce" aria-hidden="true" />
 </a>

 {/* ── Bottom fade ── */}
 <div
 aria-hidden="true"
 className="absolute inset-x-0 bottom-0 z-3 h-32 bg-linear-to-t from-bg to-transparent"
 />

 <style>{`
 /* ── Headline: fluid type that scales without overflow ── */
 .hero-title {
 font-size: clamp(3rem, 7vw + 1rem, 6.5rem);
 line-height: 0.95;
 }

 /* ── Overlay: darkens video for text contrast ── */
 .hero-overlay {
 background:
 linear-gradient(
 180deg,
 color-mix(in oklab, var(--color-bg) 72%, transparent) 0%,
 color-mix(in oklab, var(--color-bg) 40%, transparent) 40%,
 color-mix(in oklab, var(--color-bg) 55%, transparent) 70%,
 var(--color-bg) 100%
 );
 }

        /* ── Subtle neutral glow behind the headline ── */
        .hero-glow {
          background:
            radial-gradient(
              ellipse 60% 50% at 50% 45%,
              color-mix(in oklab, var(--color-text) 4%, transparent) 0%,
              transparent 70%
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
