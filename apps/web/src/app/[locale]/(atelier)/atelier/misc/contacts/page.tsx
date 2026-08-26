import { SQL_ORDER_DIRECTIONS } from "@repo/common-lib/constants/database";
import {
  DEFAULT_USER_CONTACT_ORDER_BY,
  USER_CONTACT_ORDER_BY_COLUMNS,
} from "@repo/common-lib/constants/user-contact";
import type { SqlOrderDirection } from "@repo/common-lib/types/database";
import type { Pagination } from "@repo/common-lib/types/response";
import type { UserContactOrderBy } from "@repo/common-lib/types/user-contact";
import {
  firstString,
  optionalTrim,
  parseOptionalInt,
} from "@repo/common-lib/utils/parse-params";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { AppPagination } from "@repo/ui/components/custom/app-pagination";
import { Mails } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userContactsService from "@/modules/user-contacts/user-contacts.service";
import {
  AdminPageContainer,
  AdminPageEmptyState,
  AdminPageTitle,
} from "../../../__components/admin-page.component";
import { ContactsFilters } from "./_components/contacts-filters";
import { ContactsList } from "./_components/contacts-list";
import { CONTACTS_PATH, DEFAULT_CONTACTS_PER_PAGE } from "./contacts.params";

function parseOrderBy(value: string | undefined): UserContactOrderBy {
  return USER_CONTACT_ORDER_BY_COLUMNS.includes(value as UserContactOrderBy)
    ? (value as UserContactOrderBy)
    : DEFAULT_USER_CONTACT_ORDER_BY;
}

function parseOrder(value: string | undefined): SqlOrderDirection {
  const upper = value?.toUpperCase();
  return SQL_ORDER_DIRECTIONS.includes(upper as SqlOrderDirection)
    ? (upper as SqlOrderDirection)
    : "DESC";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("atelier.contacts");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseOptionalInt(firstString(params.page)) ?? 1;
  const perPage = Math.min(
    parseOptionalInt(firstString(params.per_page)) ?? DEFAULT_CONTACTS_PER_PAGE,
    50,
  );
  const search = optionalTrim(firstString(params.search));
  const orderBy = parseOrderBy(firstString(params.order_by));
  const order = parseOrder(firstString(params.order));

  const contactsResponse = await userContactsService.getAll(userAuth.id, {
    page,
    per_page: perPage,
    paginated: true,
    order_by: orderBy,
    order,
    ...(search && { search }),
  });

  const contacts = contactsResponse.data || [];
  const pagination: Pagination | undefined = !contactsResponse.error
    ? (contactsResponse.pagination ?? undefined)
    : undefined;

  const buildPaginationHref = (p: number) => {
    const query: Record<string, string | number> = { page: p };
    if (perPage !== DEFAULT_CONTACTS_PER_PAGE) query.per_page = perPage;
    if (search) query.search = search;
    if (orderBy !== DEFAULT_USER_CONTACT_ORDER_BY) query.order_by = orderBy;
    if (order !== "DESC") query.order = order;
    return queryParamBuilder(CONTACTS_PATH, query);
  };

  const hasActiveFilters = Boolean(search);

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("pageTitle")} info={t("pageInfo")}>
        {contacts.length > 0 || hasActiveFilters ? (
          <Suspense>
            <ContactsFilters />
          </Suspense>
        ) : null}
      </AdminPageTitle>

      {contacts.length > 0 ? (
        <div className="flex flex-col gap-6">
          <ContactsList contacts={contacts} />
          {pagination && (
            <AppPagination
              pagination={pagination}
              buildHref={buildPaginationHref}
            />
          )}
        </div>
      ) : (
        <AdminPageEmptyState
          icon={<Mails />}
          description={
            hasActiveFilters ? t("emptyStateFiltered") : t("emptyState")
          }
        />
      )}
    </AdminPageContainer>
  );
}
