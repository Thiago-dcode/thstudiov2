"use client";

import type { BasePlan } from "@repo/common-lib/types/plan";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Brain, Check, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";

function formatMegaBytes(megabytes: number): string {
  return `${(Math.ceil(megabytes / 1024)).toFixed(1)} GB`;
}

export const PlanFeatures = ({ plan }: { plan: BasePlan }) => {
  const t = useTranslations("plans.features");

  const formatFeatureValue = (
    value: number | boolean,
  ): string | number | boolean => {
    if (typeof value === "boolean") return value;
    if (value === -1) return t("unlimited");
    return value;
  };

  const features: {
    key: string;
    content: string | ReactNode;
    not_available?: boolean;
    extraInfo?: string;
  }[] = useMemo(
    () => [
      {
        key: "storage",
        content: (
          <span className="text-pretty">
            <span className="font-bold tabular-nums text-text">
              {formatMegaBytes(plan.storage_limit_mb)}
            </span>
            <span className="text-text-muted"> {t("ofMediaStorage")}</span>
          </span>
        ),
      },
      {
        key: "projects",
        content: (
          <span className="text-pretty">
            <span className="font-bold tabular-nums text-text">
              {String(formatFeatureValue(plan.max_projects))}
            </span>
            <span className="text-text-muted"> {t("projects")}</span>
          </span>
        ),
      },
      {
        key: "portfolios",
        content: (
          <span className="text-pretty">
            <span className="font-bold tabular-nums text-text">
              {String(formatFeatureValue(plan.max_portfolios))}
            </span>
            <span className="text-text-muted"> {t("portfolios")}</span>
          </span>
        ),
      },
      {
        key: "services",
        content: (
          <span className="text-pretty">
            <span className="font-bold tabular-nums text-text">
              {String(formatFeatureValue(plan.max_services))}
            </span>
            <span className="text-text-muted"> {t("services")}</span>
          </span>
        ),
      },
      {
        key: "clients",
        content: (
          <span className="text-pretty">
            <span className="font-bold tabular-nums text-text">
              {String(formatFeatureValue(plan.max_clients))}
            </span>
            <span className="text-text-muted"> {t("clients")}</span>
          </span>
        ),
      },
      {
        key: "compression",
        content: plan.allow_media_compression ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5  py-0.5 text-sm font-medium",
              "bg-fg text-text",
            )}
          >
            <Zap className="size-3.5 shrink-0 text-accent" aria-hidden />
            {t("mediaCompression")}
          </span>
        ) : (
          <span className="text-text">{t("mediaCompression")}</span>
        ),
        not_available: !plan.allow_media_compression,
        extraInfo: t("mediaCompressionTooltip"),
      },
      {
        key: "ai-credits",
        content: (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-pretty">
            {plan.ai_credits > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium",
                  "bg-fg text-text",
                )}
              >
                <Brain
                  className="size-3.5 shrink-0 opacity-90 text-accent"
                  aria-hidden
                />
                <span className="font-bold tabular-nums">
                  {String(formatFeatureValue(plan.ai_credits))}
                </span>
              </span>
            ) : (
              <span className="font-bold tabular-nums text-text">
                {String(formatFeatureValue(plan.ai_credits))}
              </span>
            )}
            <span className="text-text-muted">{t("aiCredits")}</span>
          </span>
        ),
        not_available: plan.ai_credits === 0,
        extraInfo: t("aiCreditsTooltip"),
      },
      {
        key: "watermark",
        content: plan.allow_media_compression ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5  py-0.5 text-sm font-medium",
              "bg-fg text-text",
            )}
          >
            <Zap className="size-3.5 shrink-0 text-accent" aria-hidden />
            {t("mediaCompression")}
          </span>
        ) : (
          <span className="text-text">{t("mediaCompression")}</span>
        ),
        not_available: plan.is_free,
        extraInfo: t("mediaCompressionTooltip"),
      },
    ],
    [plan, t],
  );

  return (
    <ul className="flex w-full flex-col gap-1.5">
      {features.map((feature) => (
        <li
          key={feature.key}
          className={cn(
            "flex items-start gap-3 border  px-2 py-2 transition-colors sm:px-2.5",
            "hover:border-fg-1/12 ",
            feature.not_available && "opacity-55",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center  rounded-full  font-bold",
            )}
            aria-hidden
          >
            {feature.not_available ? (
              <X className="size-3.5 text-error! " />
            ) : (
              <Check className="size-5 text-success! font-bold " />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5 text-sm leading-snug lg:text-[0.9375rem]">
            {typeof feature.content === "string" ? (
              <span className="text-text">{feature.content}</span>
            ) : (
              feature.content
            )}
          </div>
          {feature.extraInfo ? (
            <InfoTooltip
              content={feature.extraInfo}
              iconClassName="mt-0.5 size-4 shrink-0"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
};
