import { ApiResponse } from "@repo/common-lib/types/response";

type ParsedResult<T> =
    | { data: T; errors: null }
    | { data: null; errors: string[] };

export async function parseBackendResponse<T>(response: Response): Promise<ParsedResult<T>> {
    const json = await response.json() as ApiResponse<T>;

    if (json.error) {
        const errors = json.error.status_code === 500
            ? ["An unexpected error occurred. Please try again later."]
            : json.error.errors;
        return { data: null, errors };
    }

    return { data: json.data, errors: null };
}
