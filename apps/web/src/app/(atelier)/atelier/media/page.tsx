import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";
import { MediaGridClient } from "./_components/media-grid-client";
import SelectMediaProvider from "@/modules/media/providers/select-media.provider";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";
import { Pagination } from "@repo/common-lib/types/response";
import { AppPagination } from "@repo/ui/components/custom/app-pagination";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

function parseOptionalInt(value: string | string[] | undefined): number | undefined {
    if (value === undefined) return undefined
    const s = Array.isArray(value) ? value[0] : value
    if (!s || s.trim() === "") return undefined
    const n = parseInt(s.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : undefined
}

export default async function MediaAtelierPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const params = await searchParams
    const page = parseOptionalInt(params.page) ?? 1
    const perPage = Math.min(parseOptionalInt(params.per_page) ?? 25, 50)

    const mediaResponse = await usersService.getAllMedia(userAuth.id, {
        page,
        per_page: perPage,
        paginated: true,
    });

    const media = mediaResponse.data || [];
    const pagination: Pagination | undefined =
        !mediaResponse.error ? mediaResponse.pagination ?? undefined : undefined

    const buildPaginationHref = (p: number) => {
        const query: Record<string, number> = { page: p }
        if (perPage !== 15) query.per_page = perPage
        return queryParamBuilder("/atelier/media", query)
    }

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Media">

            </AdminPageTitle>

            <div className="flex flex-col gap-6">
                <SelectMediaProvider>
                    <MediaGridClient media={media} username={userAuth.username} />
                </SelectMediaProvider>
                {pagination && (
                    <AppPagination
                        pagination={pagination}
                        buildHref={buildPaginationHref}
                    />
                )}
            </div>

        </AdminPageContainer>
    )
}
