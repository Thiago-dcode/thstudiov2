"use client";

import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight } from "lucide-react";
import { WebSection } from "./web-section";
import { useTranslations } from "next-intl";

export function CtaSection() {
  const t = useTranslations("landing.cta");
  return (
    <WebSection className="overflow-hidden">
      <div className="cta-glow pointer-events-none absolute inset-0" aria-hidden />

      <WebSection.Container className="flex flex-col items-center gap-8 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t("badge")}
        </span>
        <h2 className="max-w-2xl font-serif text-4xl font-bold italic leading-[1.05] tracking-tight tablet:text-6xl">
          {t("title")}
        </h2>
        <p className="max-w-lg text-base leading-relaxed text-text-muted tablet:text-lg tablet:leading-relaxed">
          {t("description")}
        </p>
        <Button asChild variant="primary" size="lg">
          <Link href="/auth/register">
            {t("button")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </WebSection.Container>

      <style>{`
        .cta-glow {
          background:
            radial-gradient(
              ellipse 60% 70% at 50% 60%,
              oklch(57% 0.19 302 / 0.06) 0%,
              transparent 70%
            ),
            radial-gradient(
              ellipse 40% 40% at 70% 30%,
              oklch(75% 0.14 85 / 0.04) 0%,
              transparent 70%
            );
        }
      `}</style>
    </WebSection>
  );
}
