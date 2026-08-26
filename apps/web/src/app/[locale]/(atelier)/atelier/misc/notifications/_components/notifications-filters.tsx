"use client";

import { SQL_ORDER_DIRECTIONS } from "@repo/common-lib/constants/database";
import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import {
  DEFAULT_USER_NOTIFICATION_ORDER_BY,
  USER_NOTIFICATION_ORDER_BY_COLUMNS,
} from "@repo/common-lib/constants/user-notification";
import type { SqlOrderDirection } from "@repo/common-lib/types/database";
import type { UserNotificationOrderBy } from "@repo/common-lib/types/user-notification";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { Button } from "@repo/ui/components/shadcn/button";
import { Select } from "@repo/ui/components/shadcn/select";
import { cn } from "@repo/ui/lib/utils";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { NOTIFICATIONS_PATH } from "../notifications.params";

type NotificationType = EnumType<"NOTIFICATION_TYPE">;

type Overrides = {
  type?: NotificationType | "";
  unread?: boolean;
  order_by?: UserNotificationOrderBy;
  order?: SqlOrderDirection;
};

function parseType(value: string | null): NotificationType | undefined {
  if (!value) return undefined;
  return ENUMS.NOTIFICATION_TYPE.includes(value as NotificationType)
    ? (value as NotificationType)
    : undefined;
}

function parseOrderBy(value: string | null): UserNotificationOrderBy {
  return USER_NOTIFICATION_ORDER_BY_COLUMNS.includes(
    value as UserNotificationOrderBy,
  )
    ? (value as UserNotificationOrderBy)
    : DEFAULT_USER_NOTIFICATION_ORDER_BY;
}

function parseOrder(value: string | null): SqlOrderDirection {
  const upper = value?.toUpperCase();
  return SQL_ORDER_DIRECTIONS.includes(upper as SqlOrderDirection)
    ? (upper as SqlOrderDirection)
    : "DESC";
}

/**
 * Builds the next query string from the current one plus overrides. `page` is deliberately dropped:
 * any filter or sort change invalidates the offset, so navigation always restarts at page 1.
 */
function buildNotificationsQueryParams(
  searchParams: URLSearchParams,
  overrides: Overrides = {},
) {
  const params: Record<string, string> = {};

  const type =
    "type" in overrides
      ? overrides.type || undefined
      : parseType(searchParams.get("type"));
  if (type) params.type = type;

  const unread = overrides.unread ?? searchParams.get("unread") === "1";
  if (unread) params.unread = "1";

  const orderBy =
    overrides.order_by ?? parseOrderBy(searchParams.get("order_by"));
  if (orderBy !== DEFAULT_USER_NOTIFICATION_ORDER_BY) params.order_by = orderBy;

  const order = overrides.order ?? parseOrder(searchParams.get("order"));
  if (order !== "DESC") params.order = order;

  const perPage = searchParams.get("per_page");
  if (perPage) params.per_page = perPage;

  return params;
}

export function NotificationsFilters() {
  const t = useTranslations("atelier.notifications");
  const tFilters = useTranslations("atelier.notifications.filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = parseType(searchParams.get("type"));
  const currentUnread = searchParams.get("unread") === "1";
  const currentOrderBy = parseOrderBy(searchParams.get("order_by"));
  const currentOrder = parseOrder(searchParams.get("order"));
  const [isPending, startTransition] = useTransition();

  const navigate = (overrides: Overrides = {}) => {
    const params = buildNotificationsQueryParams(searchParams, overrides);
    startTransition(() => {
      router.push(queryParamBuilder(NOTIFICATIONS_PATH, params));
    });
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full tablet:max-w-md">
      <div className="flex items-center gap-1.5 w-full">
        <Select
          aria-label={tFilters("typeAria")}
          value={currentType ?? ""}
          disabled={isPending}
          onChange={(e) =>
            navigate({ type: e.target.value as NotificationType | "" })
          }
          className="h-9 text-xs! flex-1"
        >
          <option value="">{tFilters("allTypes")}</option>
          {ENUMS.NOTIFICATION_TYPE.map((notificationType) => (
            <option key={notificationType} value={notificationType}>
              {t(`types.${notificationType}`)}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant={currentUnread ? "secondary" : "ghost"}
          disabled={isPending}
          onClick={() => navigate({ unread: !currentUnread })}
          className={cn(
            "h-9 px-2.5 text-[11px] font-medium shrink-0",
            !currentUnread && "hover:bg-fg-2",
          )}
        >
          {tFilters("unreadOnly")}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 w-full">
        <Select
          aria-label={tFilters("orderByAria")}
          value={currentOrderBy}
          disabled={isPending}
          onChange={(e) =>
            navigate({ order_by: e.target.value as UserNotificationOrderBy })
          }
          className="h-9 text-xs! flex-1"
        >
          {USER_NOTIFICATION_ORDER_BY_COLUMNS.map((column) => (
            <option key={column} value={column}>
              {tFilters(`orderByOptions.${column}`)}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 hover:bg-fg-2"
          disabled={isPending}
          aria-label={
            currentOrder === "DESC" ? tFilters("sortDesc") : tFilters("sortAsc")
          }
          title={
            currentOrder === "DESC" ? tFilters("sortDesc") : tFilters("sortAsc")
          }
          onClick={() =>
            navigate({ order: currentOrder === "DESC" ? "ASC" : "DESC" })
          }
        >
          {currentOrder === "DESC" ? (
            <ArrowDownWideNarrow className="size-4" />
          ) : (
            <ArrowUpNarrowWide className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
