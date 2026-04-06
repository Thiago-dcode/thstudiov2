import { LayoutTemplate, Sparkles, Handshake } from "lucide-react";
import type { ReactNode } from "react";

const PILLARS: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <LayoutTemplate className="size-6" />,
    title: "Your Site. Social-Media Easy.",
    description:
      "It looks and performs like a custom website — but you can rearrange, update, and publish as fast as posting a story. Organize your entire body of work beautifully, without touching a line of code.",
  },
  {
    icon: <Sparkles className="size-6" />,
    title: "AI Does the Heavy Lifting",
    description:
      "Writer's block on your bio? Let AI generate it. Need descriptions, tags, or SEO? AI writes, optimizes, and positions your portfolio so the right audience finds you — not the other way around.",
  },
  {
    icon: <Handshake className="size-6" />,
    title: "Built for Real Connections",
    description:
      "This isn't a feed that buries your work. Clients, collectors, and collaborators land on your portfolio and reach you directly. A platform designed around the artist-client relationship.",
  },
];

export function ValuePillarsSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pillars-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28">
        <header className="mb-14 flex flex-col items-center gap-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Why A11STUDIO
          </span>
          <h2 className="font-serif text-3xl font-medium italic tracking-tight tablet:text-4xl">
            No more fighting with social media algorithms
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-text-muted tablet:text-base">
            A professional home for your work — with the intelligence to grow your
            career and the simplicity to never slow you down.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border/40 bg-fg p-8 transition-all duration-300 hover:border-accent/20 hover:shadow-lg tablet:p-10"
            >
              <div className="pillar-card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              <span className="relative flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                {pillar.icon}
              </span>
              <h3 className="relative text-lg font-semibold tracking-tight text-text">
                {pillar.title}
              </h3>
              <p className="relative text-sm leading-relaxed text-text-muted">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .pillars-bg {
          background:
            radial-gradient(
              ellipse 50% 50% at 50% 0%,
              oklch(57% 0.19 302 / 0.03) 0%,
              transparent 70%
            );
        }
        .pillar-card-glow {
          background:
            radial-gradient(
              ellipse 80% 60% at 50% 0%,
              oklch(57% 0.19 302 / 0.04) 0%,
              transparent 70%
            );
        }
      `}</style>
    </section>
  );
}
