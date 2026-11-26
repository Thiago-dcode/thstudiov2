import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import type { TableName } from "@repo/common-lib/types/database";
import type { UserMetrics } from "@repo/common-lib/types/user";

type ResourceLimitConfig = {
  limitKey: "max_services" | "max_collections" | "max_portfolios";
  countKey: "services_count" | "collections_count" | "portfolios_count";
  label: string;
};

export const RESOURCE_LIMIT_CONFIG: Partial<
  Record<TableName, ResourceLimitConfig>
> = {
  [TABLES_ENUM.SERVICES]: {
    limitKey: "max_services",
    countKey: "services_count",
    label: "services",
  },
  [TABLES_ENUM.COLLECTIONS]: {
    limitKey: "max_collections",
    countKey: "collections_count",
    label: "collections",
  },
  [TABLES_ENUM.PORTFOLIOS]: {
    limitKey: "max_portfolios",
    countKey: "portfolios_count",
    label: "portfolios",
  },
};

export function getResourceLimitInfo(
  metrics: UserMetrics | null,
  resource: TableName,
) {
  const config = RESOURCE_LIMIT_CONFIG[resource];
  if (!config || !metrics) return null;

  const limit = metrics.active_plan[config.limitKey];
  const count = metrics.extra_data[config.countKey];

  return {
    count,
    limit,
    isAtLimit: limit !== -1 && count >= limit,
    label: config.label,
  };
}
