import { APP_API_KEY_HEADER } from "@repo/common-lib/constants/constants";
import type {
  ActionReturn,
  ErrorResponse,
} from "@repo/common-lib/types/response";
import { cookies } from "next/headers";
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

export const getFriendlyApiErrors = (errors: ErrorResponse): string[] => {
  if (errors.error.status_code === 500) {
    return ["An unexpected error occurred. Please try again later."];
  }
  return errors.error.errors;
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
export const unauthorizedActionReturn = <T, K = Record<string, any>>(
  inputs?: K,
): ActionReturn<T, K> => ({
  data: null,
  errors: ["Unauthorized"],
  inputErrors: undefined,
  inputs,
});
