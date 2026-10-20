import { EnumType } from "../constants/enums";
import { UserAuth } from "./auth";
import { Pagination } from "./response";

export type OffsetPaginationRequest = {
    paginated?: boolean,
    per_page?: number,
    page?: number
}
export type RequestLanguage = EnumType<'LANGUAGE_CODE'>;
export type RequestStore = {
    requestId: string,
    user: UserAuth | null;
    language: RequestLanguage | null;
    user_agent: string | null;
    ip_address: string | null;
    path: string | null;
    pagination: Pagination | null;
    /** Our own web server called without forwarding the visitor's IP (public SSR reads). */
    unattributed_app_call: boolean;
    /** Raw bearer token: on `@Public()` routes `AuthGuard` never resolves it into `user`. */
    bearer_token: string | null;
    /** The optional caller of a `@Public()` route; `undefined` until first resolved. */
    viewer?: UserAuth | null;
}