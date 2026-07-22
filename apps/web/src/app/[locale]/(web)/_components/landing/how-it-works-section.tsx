import { LayoutGrid, MessageCircle, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { WebSection } from "./web-section";

const STEP_ICONS: Record<string, ReactNode> = {
  organize: <LayoutGrid className="size-6" />,
  ai: <Sparkles className="size-6" />,
  connect: <MessageCircle className="size-6" />,
};

const STEP_KEYS = ["organize", "ai", "connect"] as const;

export async function HowItWorksSection() {
  const t = await getTranslations("landing.howItWorks");

  return (
    <WebSection className="overflow-hidden">
      <div
        className="how-it-works-bg pointer-events-none absolute inset-0"
        aria-hidden
      />

      <WebSection.Container>
        <WebSection.Header
          badge={t("badge")}
          title={t("title")}
          description={t("description")}
          descriptionClassName="max-w-md"
        />

        <div className="grid grid-cols-1 gap-8 tablet:grid-cols-3 tablet:gap-6">
          {STEP_KEYS.map((key, index) => (
            <article
              key={key}
              className="group flex flex-col items-center gap-5 text-center"
            >
              <div className="relative flex size-16 items-center justify-center bg-fg text-text transition-colors duration-300 group-hover:bg-fg-2">
                {STEP_ICONS[key]}
                <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center bg-text text-[11px] font-bold text-fg">
                  {index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight text-text tablet:text-lg">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-text-muted">
                {t(`steps.${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </WebSection.Container>

      <style>{`
 .how-it-works-bg {
 background: transparent;
 }
 `}</style>
    </WebSection>
  );
}
