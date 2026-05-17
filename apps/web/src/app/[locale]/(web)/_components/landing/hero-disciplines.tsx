"use client";

const DISCIPLINES = [
  "Photography",
  "Illustration",
  "Painting",
  "Sculpture",
  "Tattoo",
  "Design",
  "Fashion",
  "Animation",
  "Digital Art",
  "Architecture",
  "Film",
] as const;

export function HeroDisciplines() {
  return (
    <section
      className="hero-disciplines-mask relative z-10 mx-auto max-w-(--screen-desktop) overflow-hidden"
      aria-label="Disciplines welcomed"
    >
      <div className="hero-disciplines-track flex w-max items-center">
        <ul className="flex shrink-0 items-center gap-3 pr-3">
          {DISCIPLINES.map((label) => (
            <li key={label}>
              <span className="block whitespace-nowrap rounded-full border border-border/50 bg-fg/40 px-5 py-2.5 text-sm font-medium tracking-wide text-text-muted backdrop-blur-md transition-colors hover:border-accent/40 hover:text-text">
                {label}
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden>
          {DISCIPLINES.map((label) => (
            <li key={`${label}-clone`}>
              <span className="block whitespace-nowrap rounded-full border border-border/50 bg-fg/40 px-5 py-2.5 text-sm font-medium tracking-wide text-text-muted backdrop-blur-md transition-colors hover:border-accent/40 hover:text-text">
                {label}
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
