import { Sparkles, Palette, Users } from "lucide-react";
import type { ReactNode } from "react";

const HIGHLIGHTS: { icon: ReactNode; text: string }[] = [
  {
    icon: <Palette className="size-4 shrink-0 text-accent" />,
    text: "Pro website quality, social-media ease",
  },
  {
    icon: <Sparkles className="size-4 shrink-0 text-accent" />,
    text: "AI writes your bios, tags & positioning",
  },
  {
    icon: <Users className="size-4 shrink-0 text-accent" />,
    text: "Clients discover and connect directly",
  },
];

export function SocialProofSection() {
  return (
    <section className="border-y border-border/40">
      <div className="mx-auto w-full max-w-(--screen-desktop) px-6 py-10 tablet:px-10 tablet:py-14">
        <div className="flex flex-col items-center gap-6 phone:flex-row phone:justify-center phone:gap-12">
          {HIGHLIGHTS.map((h) => (
            <div key={h.text} className="flex items-center gap-2.5 text-center phone:text-left">
              {h.icon}
              <span className="text-sm font-medium tracking-wide text-text-muted">
                {h.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
