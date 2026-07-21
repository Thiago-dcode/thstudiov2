import type { ApiResponse } from "@repo/common-lib/types/response";
import { getTranslations } from "next-intl/server";

type ParsedResult<T> =
  | { data: T; errors: null }
  | { data: null; errors: string[] };

export async function parseBackendResponse<T>(
  response: Response,
): Promise<ParsedResult<T>> {
  const json = (await response.json()) as ApiResponse<T>;

  if (json.error) {
    if (json.error.status_code === 500) {
      const t = await getTranslations();
      return { data: null, errors: [t("actions.genericError")] };
    }
    return { data: null, errors: json.error.errors };
  }

  return { data: json.data, errors: null };
}
