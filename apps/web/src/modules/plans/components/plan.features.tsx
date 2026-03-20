"use client";

import type { BasePlan } from "@repo/common-lib/types/plan";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@repo/ui/components/shadcn/hover-card";
import { cn } from "@repo/ui/lib/utils";
import { CircleCheck, Info, Sparkles, X, Zap } from "lucide-react";
import { type ReactNode, useMemo } from "react";

function formatMegaBytes(megabytes: number): string {
  return `${(Math.ceil(megabytes / 1024)).toFixed(1)} GB`;
}

function formatFeatureValue(
  value: number | boolean,
): string | number | boolean {
  if (typeof value === "boolean") return value;
  if (value === -1) return "Unlimited";
  return value;
}

export const PlanFeatures = ({ plan }: { plan: BasePlan }) => {
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
              {formatMegaBytes(plan.max_media_size)}
            </span>
            <span className="text-text-muted"> of media storage</span>
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
            <span className="text-text-muted"> Projects</span>
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
            <span className="text-text-muted"> Portfolios</span>
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
            <span className="text-text-muted"> Services</span>
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
            <span className="text-text-muted"> Clients</span>
          </span>
        ),
      },
      {
        key: "compression",
        content: plan.allow_media_compression ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-sm font-medium",
              "bg-secondary/15 text-secondary-fg ring-1 ring-secondary/25",
            )}
          >
            <Zap className="size-3.5 shrink-0 opacity-90" aria-hidden />
            Media compression
          </span>
        ) : (
          <span className="text-text">Media compression</span>
        ),
        not_available: !plan.allow_media_compression,
        extraInfo:
          "Choose your preferred compression level when uploading photos. Balance between image quality and file size to optimize your storage and loading times.",
      },
      {
        key: "ai-credits",
        content: (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-pretty">
            {plan.ai_credits > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-medium",
                  "bg-accent/15 text-accent ring-1 ring-accent/30",
                )}
              >
                <Sparkles
                  className="size-3.5 shrink-0 opacity-90"
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
            <span className="text-text-muted"> AI Credits</span>
          </span>
        ),
        not_available: plan.ai_credits === 0,
        extraInfo:
          "Leverage AI to automate repetitive tasks. Automatically generate titles, descriptions, and tags for your media based on content analysis, saving you time and effort.",
      },
    ],
    [plan],
  );

  return (
    <ul className="flex w-full flex-col gap-1.5">
      {features.map((feature) => (
        <li
          key={feature.key}
          className={cn(
            "flex items-start gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors sm:px-2.5",
            "hover:border-fg-1/12 hover:bg-fg-1/[0.06]",
            feature.not_available && "opacity-55",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
              feature.not_available
                ? "bg-fg-1/8 text-text-muted"
                : "bg-accent/[0.12] text-accent",
            )}
            aria-hidden
          >
            {feature.not_available ? (
              <X className="size-3.5 stroke-[2.25]" />
            ) : (
              <CircleCheck className="size-3.5 stroke-[2.25]" />
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
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-fg-1/10 hover:text-text"
                  aria-label="More information"
                >
                  <Info className="size-4" aria-hidden />
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-72 max-w-[min(18rem,calc(100vw-2rem))] text-sm leading-relaxed text-text"
                side="top"
                align="end"
              >
                {feature.extraInfo}
              </HoverCardContent>
            </HoverCard>
          ) : null}
        </li>
      ))}
    </ul>
  );
};
