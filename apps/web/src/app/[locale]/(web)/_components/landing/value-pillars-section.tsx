import Image, { type StaticImageData } from "next/image";
import { getTranslations } from "next-intl/server";
import brainIcon from "@/assets/icons/custom/brain.png";
import cloudIcon from "@/assets/icons/custom/cloud.png";
import handsIcon from "@/assets/icons/custom/hands.png";
import { WebSection } from "./web-section";

const ICONS: StaticImageData[] = [cloudIcon, brainIcon, handsIcon];

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
              className="surface-card group relative flex flex-col overflow-hidden transition-all duration-300 hover:border-border-em hover:shadow-lg"
            >
              <div
                className="pillar-card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />

              <div className="flex items-start justify-between p-8 tablet:p-10">
                <Image
                  src={ICONS[index]!}
                  alt=""
                  className="size-16 object-contain"
                />
                <span className="font-mono text-sm text-text-muted opacity-40 select-none">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="mx-8 border-t border-border tablet:mx-10" />

              <div className="flex flex-col gap-3 p-8 pt-6 tablet:p-10 tablet:pt-6">
                <h3 className="text-xl font-bold tracking-tight text-text">
                  {pillar.title}
                </h3>
                <p className="text-base leading-relaxed text-text-muted tablet:text-lg">
                  {pillar.description}
                </p>
              </div>
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
