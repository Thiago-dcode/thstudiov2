import type { Pagination } from "@repo/common-lib/types/response";
import { firstString } from "@repo/common-lib/utils/parse-params";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { AppPagination } from "@repo/ui/components/custom/app-pagination";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import SelectMediaProvider from "@/modules/media/providers/select-media.provider";
import usersService from "@/modules/users/users.service";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { MediaGridClient } from "./_components/media-grid-client";
import { MediaSearch } from "./_components/media-search";
import {
  DEFAULT_MEDIA_PER_PAGE,
  MEDIA_PATH,
  mediaListQueryParams,
  parseMediaListQuery,
} from "./media.params";

export default async function MediaAtelierPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("atelier.media");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const params = await searchParams;
  const query = parseMediaListQuery((key) => firstString(params[key]));
  const requestedPage = Number.parseInt(firstString(params.page) ?? "", 10);
  const page = requestedPage > 0 ? requestedPage : 1;
  const perPage = Math.min(query.per_page ?? DEFAULT_MEDIA_PER_PAGE, 50);

  const mediaResponse = await usersService.getAllMedia(userAuth.id, {
    page,
    per_page: perPage,
    completed: true,
    paginated: true,
    order_by: query.order_by,
    order: query.order,
    ...(query.search && { search: query.search }),
    ...(query.shape && { shape: query.shape }),
    ...(query.media_type && { media_type: query.media_type }),
  });

  const media = mediaResponse.data || [];
  const pagination: Pagination | undefined = !mediaResponse.error
    ? (mediaResponse.pagination ?? undefined)
    : undefined;

  const buildPaginationHref = (p: number) =>
    queryParamBuilder(MEDIA_PATH, { ...mediaListQueryParams(query), page: p });

  // Sorting only reorders the library, so it is not a filter: it never explains an empty grid.
  const hasActiveFilters = Boolean(
    query.search || query.shape || query.media_type,
  );

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("pageTitle")}>
        {(pagination?.total_count && pagination.total_count > 0) ||
        hasActiveFilters ? (
          <Suspense>
            <MediaSearch />
          </Suspense>
        ) : null}
      </AdminPageTitle>

      <div className="flex flex-col gap-6">
        <SelectMediaProvider>
          <MediaGridClient
            media={media}
            username={userAuth.username}
            hasActiveFilters={hasActiveFilters}
          />
        </SelectMediaProvider>
        {pagination && (
          <AppPagination
            pagination={pagination}
            buildHref={buildPaginationHref}
          />
        )}
      </div>
    </AdminPageContainer>
  );
}
