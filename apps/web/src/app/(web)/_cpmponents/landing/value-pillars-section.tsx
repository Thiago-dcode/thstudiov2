import { Images, Compass, Shield } from "lucide-react";
import type { ReactNode } from "react";

const PILLARS: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <Images className="size-5" />,
    title: "Build Your Portfolio",
    description:
      "Curate galleries, organize by project, and present your work with the attention it deserves.",
  },
  {
    icon: <Compass className="size-5" />,
    title: "Get Discovered",
    description:
      "Appear in search results filtered by specialty, location, and medium — reach the right audience.",
  },
  {
    icon: <Shield className="size-5" />,
    title: "Own Your Presence",
    description:
      "Your profile, your rules. No algorithms burying your work — just a clean, permanent home for it.",
  },
];

export function ValuePillarsSection() {
  return (
    <section className="mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28">
      <header className="mb-14 flex flex-col items-center gap-3 text-center">
        <h2 className="font-serif text-3xl font-medium italic tracking-tight tablet:text-4xl">
          Why A11STUDIO
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-6 tablet:grid-cols-3">
        {PILLARS.map((pillar) => (
          <article
            key={pillar.title}
            className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-fg p-8 tablet:p-10"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-fg-1 text-text-muted">
              {pillar.icon}
            </span>
            <h3 className="text-base font-semibold tracking-tight text-text">
              {pillar.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-muted">
              {pillar.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
