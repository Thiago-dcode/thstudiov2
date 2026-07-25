import { getTranslations } from "next-intl/server";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { WebSection } from "./web-section";

export async function CtaSection() {
  const t = await getTranslations("landing.cta");

  return (
    <WebSection className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden">
      <WebSection.Container className="flex max-w-3xl flex-col items-center gap-8 py-24 text-center tablet:gap-10 tablet:py-32">
        <div className="flex flex-col items-center gap-5">
          <span aria-hidden="true" className="h-px w-12 bg-border-em" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
            {t("badge")}
          </span>
        </div>

        <h2 className="max-w-2xl font-serif text-4xl font-bold leading-[1.05] tracking-tight tablet:text-6xl">
          {t("title")}
        </h2>

        <p className="max-w-lg text-base leading-relaxed text-text-muted tablet:text-lg tablet:leading-relaxed">
          {t("description")}
        </p>

        <div className="pt-4">
          <RegistrationCtaButton intent="createPortfolio" size="lg" />
        </div>
      </WebSection.Container>
    </WebSection>
  );
}
