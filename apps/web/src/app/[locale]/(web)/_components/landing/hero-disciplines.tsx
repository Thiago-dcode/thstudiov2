"use client";

import { useTranslations } from "next-intl";

const DISCIPLINE_KEYS = [
  "photography",
  "illustration",
  "painting",
  "sculpture",
  "tattoo",
  "design",
  "fashion",
  "animation",
  "digitalArt",
  "architecture",
  "film",
] as const;

export function HeroDisciplines() {
  const t = useTranslations("landing.hero");

  return (
    <section
      className="hero-disciplines-mask relative z-10 mx-auto max-w-(--screen-desktop) overflow-hidden"
      aria-label={t("disciplinesAria")}
    >
      <div className="hero-disciplines-track flex w-max items-center">
        <ul className="flex shrink-0 items-center gap-3 pr-3">
          {DISCIPLINE_KEYS.map((key) => (
            <li key={key}>
              <span className="block whitespace-nowrap border border-border/50 bg-fg/40 px-5 py-2.5 text-sm font-medium tracking-wide text-text-muted backdrop-blur-md transition-colors hover:border-border-em hover:text-text">
                {t(`disciplines.${key}`)}
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden>
          {DISCIPLINE_KEYS.map((key) => (
            <li key={`${key}-clone`}>
              <span className="block whitespace-nowrap border border-border/50 bg-fg/40 px-5 py-2.5 text-sm font-medium tracking-wide text-text-muted backdrop-blur-md transition-colors hover:border-border-em hover:text-text">
                {t(`disciplines.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
 .hero-disciplines-mask {
 mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
 -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
 }
 .hero-disciplines-track {
 animation: hero-disciplines-scroll 34s linear infinite;
 }
 @keyframes hero-disciplines-scroll {
 from { transform: translateX(0); }
 to { transform: translateX(-50%); }
 }
 @media (prefers-reduced-motion: reduce) {
 .hero-disciplines-track {
 animation: none;
 }
 }
 `}</style>
    </section>
  );
}
