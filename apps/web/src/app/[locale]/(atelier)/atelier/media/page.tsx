import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import type { Pagination } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { AppPagination } from "@repo/ui/components/custom/app-pagination";
import { redirect } from "next/navigation";
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

function parseOptionalInt(
  value: string | string[] | undefined,
): number | undefined {
  if (value === undefined) return undefined;
  const s = Array.isArray(value) ? value[0] : value;
  if (!s || s.trim() === "") return undefined;
  const n = parseInt(s.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseOptionalString(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const s = Array.isArray(value) ? value[0] : value;
  return s?.trim() || undefined;
}

function parseOptionalShape(
  value: string | string[] | undefined,
): EnumType<"MEDIA_SHAPE"> | undefined {
  const s = parseOptionalString(value);
  if (!s) return undefined;
  return ENUMS.MEDIA_SHAPE.includes(s as EnumType<"MEDIA_SHAPE">)
    ? (s as EnumType<"MEDIA_SHAPE">)
    : undefined;
}

export default async function MediaAtelierPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseOptionalInt(params.page) ?? 1;
  const perPage = Math.min(parseOptionalInt(params.per_page) ?? 25, 50);
  const search = parseOptionalString(params.search);
  const shape = parseOptionalShape(params.shape);

  const mediaResponse = await usersService.getAllMedia(userAuth.id, {
    page,
    per_page: perPage,
    paginated: true,
    ...(search && { search }),
    ...(shape && { shape }),
  });

  const media = mediaResponse.data || [];
  const pagination: Pagination | undefined = !mediaResponse.error
    ? (mediaResponse.pagination ?? undefined)
    : undefined;

  const buildPaginationHref = (p: number) => {
    const query: Record<string, string | number> = { page: p };
    if (perPage !== 15) query.per_page = perPage;
    if (search) query.search = search;
    if (shape) query.shape = shape;
    return queryParamBuilder("/atelier/media", query);
  };

  const hasActiveFilters = Boolean(search || shape);

  return (
    <AdminPageContainer>
      <AdminPageTitle title="Media">
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
