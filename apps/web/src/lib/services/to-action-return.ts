import type {
  ActionReturn,
  Error as ApiError,
  ApiResponse,
} from "@repo/common-lib/types/response";

/**
 * Browser counterpart to `getFriendlyApiErrors` (`modules/auth/helpers.ts`), which cannot run
 * here because it translates via `getTranslations()`.
 *
 * Both suppressed cases carry a message no user should read:
 * - `status_code: 0` is what `FetchApi` assigns to a network failure, so the message is the
 *   browser's raw "Failed to fetch"/"NetworkError when attempting to fetch resource".
 * - `>= 500` is an internal fault. The range rather than `=== 500` also covers the 502/504 an
 *   upstream proxy produces, whose message would be a bare "HTTP 504".
 *
 * They resolve to an EMPTY list rather than a translated string on purpose: an empty `errors`
 * is exactly what makes a caller's own generic-error fallback fire (see `extractReturnError` in
 * `modules/media/providers/media.provider.tsx`), which keeps i18n out of this module entirely.
 */
const friendlyErrors = (error: ApiError): string[] =>
  error.status_code === 0 || error.status_code >= 500
    ? []
    : (error.errors ?? []).filter(Boolean);

/** Adapts the API's transport envelope to the `ActionReturn` shape server actions return. */
export const toActionReturn = <T, K = Record<string, any>>(
  response: ApiResponse<T>,
  inputs?: K,
): ActionReturn<T, K> => {
  if (response.error) {
    return {
      data: null,
      errors: friendlyErrors(response.error),
      inputErrors: undefined,
      inputs,
    };
  }

  // `pagination` only exists on `SuccessResponse`, so it is read inside this branch where the
  // union has narrowed.
  return {
    data: response.data,
    pagination: response.pagination,
    errors: null,
    inputErrors: undefined,
  };
};
