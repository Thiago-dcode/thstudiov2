import { SQL_ORDER_DIRECTIONS } from "@repo/common-lib/constants/database";
import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import {
  DEFAULT_USER_NOTIFICATION_ORDER_BY,
  USER_NOTIFICATION_ORDER_BY_COLUMNS,
} from "@repo/common-lib/constants/user-notification";
import type { SqlOrderDirection } from "@repo/common-lib/types/database";
import type { Pagination } from "@repo/common-lib/types/response";
import type { UserNotificationOrderBy } from "@repo/common-lib/types/user-notification";
import {
  firstString,
  parseOptionalInt,
} from "@repo/common-lib/utils/parse-params";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { AppPagination } from "@repo/ui/components/custom/app-pagination";
import { Bell } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userNotificationsService from "@/modules/user-notifications/user-notifications.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../../__components/admin-page.component";
import { NotificationsFilters } from "./_components/notifications-filters";
import { NotificationsList } from "./_components/notifications-list";
import {
  DEFAULT_NOTIFICATIONS_PER_PAGE,
  NOTIFICATIONS_PATH,
} from "./notifications.params";

function parseType(
  value: string | undefined,
): EnumType<"NOTIFICATION_TYPE"> | undefined {
  if (!value) return undefined;
  return ENUMS.NOTIFICATION_TYPE.includes(
    value as EnumType<"NOTIFICATION_TYPE">,
  )
    ? (value as EnumType<"NOTIFICATION_TYPE">)
    : undefined;
}

function parseOrderBy(value: string | undefined): UserNotificationOrderBy {
  return USER_NOTIFICATION_ORDER_BY_COLUMNS.includes(
    value as UserNotificationOrderBy,
  )
    ? (value as UserNotificationOrderBy)
    : DEFAULT_USER_NOTIFICATION_ORDER_BY;
}

function parseOrder(value: string | undefined): SqlOrderDirection {
  const upper = value?.toUpperCase();
  return SQL_ORDER_DIRECTIONS.includes(upper as SqlOrderDirection)
    ? (upper as SqlOrderDirection)
    : "DESC";
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("atelier.notifications");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseOptionalInt(firstString(params.page)) ?? 1;
  const perPage = Math.min(
    parseOptionalInt(firstString(params.per_page)) ??
      DEFAULT_NOTIFICATIONS_PER_PAGE,
    50,
  );
  const type = parseType(firstString(params.type));
  const unread = firstString(params.unread) === "1";
  const orderBy = parseOrderBy(firstString(params.order_by));
  const order = parseOrder(firstString(params.order));

  const notificationsResponse = await userNotificationsService.getAll(
    userAuth.id,
    {
      page,
      per_page: perPage,
      paginated: true,
      order_by: orderBy,
      order,
      ...(type && { type }),
      ...(unread && { unread }),
    },
  );

  const notifications = notificationsResponse.data || [];
  const pagination: Pagination | undefined = !notificationsResponse.error
    ? (notificationsResponse.pagination ?? undefined)
    : undefined;

  const buildPaginationHref = (p: number) => {
    const query: Record<string, string | number> = { page: p };
    if (perPage !== DEFAULT_NOTIFICATIONS_PER_PAGE) query.per_page = perPage;
    if (type) query.type = type;
    if (unread) query.unread = "1";
    if (orderBy !== DEFAULT_USER_NOTIFICATION_ORDER_BY)
      query.order_by = orderBy;
    if (order !== "DESC") query.order = order;
    return queryParamBuilder(NOTIFICATIONS_PATH, query);
  };

  const hasActiveFilters = Boolean(type || unread);

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("pageTitle")} info={t("pageInfo")}>
        {notifications.length > 0 || hasActiveFilters ? (
          <Suspense>
            <NotificationsFilters />
          </Suspense>
        ) : null}
      </AdminPageTitle>

      {notifications.length > 0 ? (
        <div className="flex flex-col gap-6">
          <NotificationsList notifications={notifications} />
          {pagination && (
            <AppPagination
              pagination={pagination}
              buildHref={buildPaginationHref}
            />
          )}
        </div>
      ) : (
        <AdminPageEmptyState
          icon={<Bell />}
          description={
            hasActiveFilters ? t("emptyStateFiltered") : t("emptyState")
          }
        />
      )}
    </AdminPageContainer>
  );
}
