import { Handshake, LayoutTemplate, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { WebSection } from "./web-section";

const ICONS: ReactNode[] = [
 <LayoutTemplate key="layout" className="size-6" />,
 <Sparkles key="sparkles" className="size-6" />,
 <Handshake key="handshake" className="size-6" />,
];

export async function ValuePillarsSection() {
 const t = await getTranslations("landing.valuePillars");
 const items = t.raw("items") as { title: string; description: string }[];

 return (
 <WebSection id="value-pillars" className="overflow-hidden">
 <WebSection.Container>
 <WebSection.Header
 badge={t("header.badge")}
 title={t("header.title")}
 description={t("header.description")}
 />

 <div className="grid grid-cols-1 gap-6 tablet:grid-cols-3">
 {items.map((pillar, index) => (
 <article
 key={pillar.title}
 className="surface-card group relative flex flex-col gap-5 overflow-hidden p-8 transition-all duration-300 hover:border-border-em hover:shadow-lg tablet:p-10"
 >
 <div
 className="pillar-card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
 aria-hidden
 />
 <span className="relative flex size-12 items-center justify-center bg-fg-1 text-text">
 {ICONS[index]}
 </span>
 <h3 className="relative text-xl font-bold tracking-tight text-text">
 {pillar.title}
 </h3>
 <p className="relative text-base leading-relaxed text-text-muted tablet:text-lg">
 {pillar.description}
 </p>
 </article>
 ))}
 </div>
 </WebSection.Container>

      <style>{`
        .pillar-card-glow {
          background:
            radial-gradient(
              circle at 18% 0%,
              color-mix(in oklab, var(--color-fg-1) 40%, transparent),
              transparent 42%
            );
        }
      `}</style>
 </WebSection>
 );
}
