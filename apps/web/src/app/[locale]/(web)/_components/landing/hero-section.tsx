import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { serverEnv } from "@/env/server";
import { getTranslations } from "next-intl/server";

export async function HeroSection() {
  const session = await userSession();
  const t = await getTranslations("landing.hero");

  return (
    <section
      aria-label={`${t("titlePrefix")} ${t("titleAccent")} ${t("titleSuffix")}`}
      className="relative flex w-full items-center justify-center overflow-hidden h-[calc(100vh-4rem)]"
    
    >
      {/* ── Background video ── */}
      <video
        src={`${serverEnv.ASSETS_URL}/videos/hero-bg.mp4`}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 z-0 h-screen w-full object-cover"
      />

      {/* ── Gradient overlays for contrast & brand warmth ── */}
      <div
        aria-hidden="true"
        className="hero-overlay absolute inset-0 z-1"
      />
      <div
        aria-hidden="true"
        className="hero-glow absolute inset-0 z-2"
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 px-5 py-16 text-center tablet:py-24">
        {/* Badge */}
        <span className="hero-stagger-1 inline-flex items-center gap-2 rounded-full border border-border/40 bg-fg/50 px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted backdrop-blur-md">
          <Sparkles className="size-3 text-accent" aria-hidden="true" />
          {t("disclaimer")}
        </span>

        {/* Headline */}
        <h1 className="hero-stagger-2 mx-auto max-w-5xl text-7xl! font-black leading-[0.92] tracking-tight text-text">
          {t("titlePrefix")}{" "}
          <span className="hero-accent-text italic">{t("titleAccent")}</span>{" "}
          {t("titleSuffix")}
        </h1>

        {/* Subtitle */}
        <p className="hero-stagger-3 max-w-xl text-lg! leading-relaxed text-text-muted tablet:text-lg tablet:leading-relaxed">
          {t("subtitle")}
        </p>

        {/* CTAs */}
        <div className="hero-stagger-4 flex flex-col items-center gap-3 phone:flex-row phone:gap-4">
          <Button asChild variant="primary" size="lg" className="min-h-[48px] min-w-[180px] text-base font-medium shadow-lg shadow-accent/20">
            <Link href={session ? "/atelier" : "/auth/register"}>
              {session ? t("primaryCtaLoggedIn") : t("primaryCtaLoggedOut")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="min-h-[48px] text-base">
            <Link href="/artists">{t("secondaryCta")}</Link>
          </Button>
        </div>
      </div>

      {/* ── Scroll down indicator ── */}
      <a
        href="#value-pillars"
        aria-label="Scroll to next section"
        className="hero-stagger-4 absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-text-muted/50 transition-colors hover:text-accent"
      >
        <ChevronDown className="size-5 hero-bounce" />
      </a>

      {/* ── Bottom fade ── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-3 h-32 bg-linear-to-t from-bg to-transparent"
      />

      <style>{`
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

        /* ── Brand glow behind the headline ── */
        .hero-glow {
          background:
            radial-gradient(
              ellipse 60% 50% at 50% 45%,
              color-mix(in oklab, var(--color-accent) 10%, transparent) 0%,
              transparent 70%
            ),
            radial-gradient(
              ellipse 35% 30% at 30% 55%,
              color-mix(in oklab, var(--color-accent) 6%, transparent) 0%,
              transparent 70%
            );
        }

        /* ── Accent gradient text ── */
        .hero-accent-text {
          display: inline-block;
          padding-inline: 0.15em;
          background: linear-gradient(
            135deg,
            var(--brand-light) 0%,
            var(--brand) 50%,
            var(--brand-dark) 100%
          );
          -webkit-text-fill-color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          filter: drop-shadow(0 0 32px color-mix(in oklab, var(--brand) 35%, transparent));
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
