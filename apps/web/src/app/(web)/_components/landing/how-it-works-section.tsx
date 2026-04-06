import { LayoutGrid, Sparkles, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { WebSection } from "./web-section";

const STEPS: { step: number; icon: ReactNode; title: string; description: string }[] = [
  {
    step: 1,
    icon: <LayoutGrid className="size-6" />,
    title: "Organize & Customize",
    description:
      "Upload your work and arrange it into a stunning portfolio. Customize the layout like editing a social post — no code, no friction.",
  },
  {
    step: 2,
    icon: <Sparkles className="size-6" />,
    title: "AI Positions You",
    description:
      "AI generates your bio, descriptions, and tags. It optimizes your portfolio for search engines so the right people find you.",
  },
  {
    step: 3,
    icon: <MessageCircle className="size-6" />,
    title: "Clients Connect",
    description:
      "Collectors, agencies, and collaborators discover your portfolio and reach out directly. Real relationships, no middlemen.",
  },
];

export function HowItWorksSection() {
  return (
    <WebSection className="overflow-hidden">
      <div className="how-it-works-bg pointer-events-none absolute inset-0" aria-hidden />

      <WebSection.Container>
        <WebSection.Header
          badge="How it works"
          title="From upload to your first client"
          description="A portfolio that builds your career, not just displays your work."
          descriptionClassName="max-w-md"
        />

        <div className="grid grid-cols-1 gap-8 tablet:grid-cols-3 tablet:gap-6">
          {STEPS.map((s) => (
            <article
              key={s.step}
              className="group flex flex-col items-center gap-5 text-center"
            >
              <div className="relative flex size-16 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent/15">
                {s.icon}
                <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  {s.step}
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight text-text tablet:text-lg">
                {s.title}
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-text-muted">
                {s.description}
              </p>
            </article>
          ))}
        </div>
      </WebSection.Container>

      <style>{`
        .how-it-works-bg {
          background:
            radial-gradient(
              ellipse 60% 60% at 50% 100%,
              oklch(57% 0.19 302 / 0.03) 0%,
              transparent 70%
            );
        }
      `}</style>
    </WebSection>
  );
}
