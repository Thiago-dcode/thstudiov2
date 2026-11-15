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
    method?: string | null,
    ip_address: string | null;
    path: string | null;
    /**
     * Resolves the secret-free path when it is read. Route params (`:token`, `:code`) are only
     * known once the route is matched, so the path can't be masked when the store is created.
     * Wins over `path` when set.
     */
    path_resolver?: () => string | null;
    pagination: Pagination | null;
    /** Our own web server called without forwarding the visitor's IP (public SSR reads). */
    unattributed_app_call: boolean;
    /** Raw bearer token: on `@Public()` routes `AuthGuard` never resolves it into `user`. */
    bearer_token: string | null;
    /** The optional caller of a `@Public()` route; `undefined` until first resolved. */
    viewer?: UserAuth | null;
}

/**
 * The request fields every request-bound log line carries, built from an explicit allow-list of
 * `RequestStore` so no secret (bearer token, user token, email) can reach a log file. Keys are
 * snake_case and nested under `request`, so Loki's `| json` flattens them to `request_user_id`.
 */
export type RequestLogContext = {
    id: string;
    method: string | null;
    /**
     * No query string, and sensitive route params masked (`/email-preferences/:token/token`):
     * both can carry one-time tokens. `null` until the route is matched and for unmatched paths.
     */
    path: string | null;
    ip_address: string | null;
    user_agent: string | null;
    /** `user ?? viewer`. */
    user_id: number | null;
    /** `role.name` of the same user. */
    user_role: string | null;
    language: RequestLanguage | null;
    unattributed_app_call: boolean;
}