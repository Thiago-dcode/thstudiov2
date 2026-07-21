import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { Eye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PlanFeatures } from "@/modules/plans/components/plan.features";
import usersService from "@/modules/users/users.service";

export const UserMetricsSkeleton = () => {
  return (
    <section className="w-full flex flex-col gap-3 items-start justify-start">
      <Skeleton className="h-6 w-28" />
      <div className="flex items-stretch justify-start gap-3 w-full flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="flex flex-col items-center justify-center gap-2 min-w-30 p-3 bg-fg border border-border"
          >
            <Skeleton className="h-4 w-14 rounded" />
            <Skeleton className="h-6 w-18 rounded" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

function getStatusColor(percentage: number, limit: number) {
  if (limit === -1) return "accent" as const;
  if (percentage >= 90) return "error" as const;
  if (percentage >= 70) return "warning" as const;
  return "success" as const;
}

const STATUS_STYLES = {
  success: {
    bar: "bg-success",
    track: "bg-success/15",
    border: "border-success/25",
    label: "text-success",
  },
  warning: {
    bar: "bg-warning",
    track: "bg-warning/15",
    border: "border-warning/25",
    label: "text-warning",
  },
  error: {
    bar: "bg-error",
    track: "bg-error/15",
    border: "border-error/25",
    label: "text-error",
  },
  accent: {
    bar: "bg-text",
    track: "bg-fg",
    border: "border-border-em",
    label: "text-text",
  },
} as const;

export const UserMetrics = async ({ userId }: { userId: number }) => {
  const t = await getTranslations("atelier.common.metrics");
  const metricsResult = await usersService.metrics(userId);
  if (!metricsResult.data) return <div>{t("noDataAvailable")}</div>;

  const { extra_data, active_plan } = metricsResult.data;
  if (!extra_data || !active_plan) return <div>{t("noDataAvailable")}</div>;
  const {
    clients_count,
    media_count,
    storage_used_mb,
    collections_count,
    portfolios_count,
    projects_count,
    services_count,
    ai_credits,
    ai_credits_consumed,
  } = extra_data;
  const {
    max_clients,
    storage_limit_mb,
    max_portfolios,
    max_collections,
    max_projects,
    max_services,
    translation,
    name,
    ai_credits: plan_ai_credits,
  } = active_plan;

  const METRICS: {
    title: string;
    used: number;
    limit: number;
    format?: (used: number, limit: number) => string;
  }[] = [
    {
      title: t("media"),
      used: media_count,
      limit: -1,
    },
    {
      title: t("storage"),
      used: storage_used_mb,
      limit: storage_limit_mb,
      format: (used, limit) =>
        `${(used / 1024).toFixed(1)} / ${(limit / 1024).toFixed(0)} GB`,
    },
    {
      title: t("clients"),
      used: clients_count,
      limit: max_clients,
    },
    {
      title: t("portfolios"),
      used: portfolios_count,
      limit: max_portfolios,
    },
    {
      title: t("collections"),
      used: collections_count,
      limit: max_collections,
    },
    {
      title: t("projects"),
      used: projects_count,
      limit: max_projects,
    },
    {
      title: t("services"),
      used: services_count,
      limit: max_services,
    },
    {
      title: t("aiCredits"),
      used: ai_credits_consumed,
      limit: ai_credits + plan_ai_credits,
    },
  ];

  const getPercentage = (used: number, limit: number) => {
    if (limit === Infinity || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <section className="w-full flex flex-col gap-3 items-start justify-start">
      <Popover>
        <PopoverTrigger>
          <Badge className="w-fit flex gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <span>
              {translation?.name || name} {t("planSuffix")}
            </span>{" "}
            <Eye size={14} />
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-fg">
          <PlanFeatures plan={active_plan} />
        </PopoverContent>
      </Popover>

      <div className="flex items-stretch justify-start gap-3 w-full flex-wrap">
        {METRICS.map(({ title, used, limit, format }, i) => {
          const percentage = used === limit ? 100 : getPercentage(used, limit);
          const status = getStatusColor(percentage, limit);
          const styles = STATUS_STYLES[status];

          const displayValue = format
            ? format(used, limit)
            : limit === -1
              ? `${used}`
              : `${used} / ${limit}`;

          return (
            <div
              key={`${title}-${i}`}
              className={cn(
                "flex flex-col items-center justify-between gap-2 min-w-30 px-3 py-2.5",
                "bg-fg border transition-colors",
                styles.border,
              )}
            >
              <p className="text-xs font-medium text-text-muted tracking-wide uppercase">
                {title}
              </p>
              <p
                className={cn(
                  "font-semibold text-base tabular-nums",
                  styles.label,
                )}
              >
                {displayValue}
              </p>

              {limit !== -1 && (
                <div
                  className={cn("w-full h-1.5 overflow-hidden", styles.track)}
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      styles.bar,
                    )}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
