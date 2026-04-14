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
}