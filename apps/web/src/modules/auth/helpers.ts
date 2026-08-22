import { API_ERRORS } from "@repo/common-lib/constants/api-errors";
import { APP_API_KEY_HEADER } from "@repo/common-lib/constants/headers";
import type {
  ActionReturn,
  ErrorResponse,
} from "@repo/common-lib/types/response";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ZodError } from "zod";
import { serverEnv } from "@/env/server";
import { fetchFrontApi } from "@/lib/facade/fetchApi";
import type { UserAuth } from "./auth.types";
import { userSession } from "./server-actions/user-session.action";

export const setUserSessionApi = async (
  user: UserAuth,
): Promise<{ success: boolean }> => {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    await fetchFrontApi().post<{ success: boolean }>({
      resource: "session",
      headers: {
        "Content-Type": "application/json",
        "Set-cookie": cookieHeader,
        [APP_API_KEY_HEADER]: serverEnv.APP_API_KEY,
      },
      body: user,
    });
    return { success: true };
  } catch (error) {
    console.error("Error setting user session:", error);
    return { success: false };
  }
};

export const getFriendlyApiErrors = async (
  errors: ErrorResponse,
): Promise<string[]> => {
  if (errors.error.status_code === 500) {
    const t = await getTranslations();
    return [t("actions.genericError")];
  }
  return errors.error.errors;
};

/**
 * Failure shape for a create/update action, from an API error response.
 *
 * Titles are unique per user, and the API rejects a duplicate with `TITLE_ALREADY_EXISTS`.
 * That one renders inline under the title field — where the user can actually fix it —
 * rather than as a toast. Everything else falls through to the generic error list.
 * Shared by the portfolio, service and collection actions.
 */
export const getFailureFromApiError = async (
  response: ErrorResponse,
): Promise<{
  data: null;
  errors: string[];
  inputErrors?: Record<string, string>;
}> => {
  if (response.error.api_error_code === API_ERRORS.TITLE_ALREADY_EXISTS) {
    const t = await getTranslations();
    return {
      data: null,
      errors: [],
      inputErrors: { title: t("actions.titleAlreadyExists") },
    };
  }

  return { data: null, errors: await getFriendlyApiErrors(response) };
};

export const getObjErrorFromZod = (error: ZodError): Record<string, string> => {
  return error.issues.reduce(
    (acc, issue) => {
      const field = issue.path.join(".");
      if (field) acc[field] = issue.message;
      return acc;
    },
    {} as Record<string, string>,
  );
};

/**
 * Loads the current session. Used as defense-in-depth in server actions
 * on top of API-side ownership checks.
 */
export const requireSession = async (): Promise<UserAuth | null> => {
  return await userSession();
};

/**
 * Returns true when the current session belongs to the given resource owner id.
 */
export const isSessionOwner = (
  session: UserAuth | null,
  resourceOwnerId: number | null | undefined,
): boolean => {
  return (
    session !== null &&
    resourceOwnerId !== null &&
    resourceOwnerId !== undefined &&
    session.id === resourceOwnerId
  );
};

/**
 * Returns true when `sessionId` matches the resource owner.
 */
export const requireOwner = (
  sessionId: number | null | undefined,
  resourceOwnerId: number | null | undefined,
): boolean => {
  return (
    sessionId !== null &&
    sessionId !== undefined &&
    resourceOwnerId !== null &&
    resourceOwnerId !== undefined &&
    sessionId === resourceOwnerId
  );
};

/**
 * Standard "Unauthorized" ActionReturn shape for server actions rejecting
 * a request that doesn't belong to the caller.
 */
export const unauthorizedActionReturn = async <T, K = Record<string, any>>(
  inputs?: K,
): Promise<ActionReturn<T, K>> => {
  const t = await getTranslations();
  return {
    data: null,
    errors: [t("actions.unauthorized")],
    inputErrors: undefined,
    inputs,
  };
};
