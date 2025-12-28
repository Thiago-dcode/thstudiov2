import { APP_API_KEY_HEADER } from "@repo/common-lib/constants/constants";
import { UserAuth } from "./auth.types";
import { fetchFrontApi } from "@/lib/facade/fetchApi";
import { cookies } from "next/headers";
import { ErrorResponse } from "@repo/common-lib/types/response";

export const setUserSessionApi = async (user: UserAuth): Promise<{ success: boolean }> => {
    try {
        // Get cookies from the incoming request to forward them
        const cookieStore = await cookies();
        const cookieHeader = cookieStore.getAll()
            .map(c => `${c.name}=${c.value}`)
            .join('; ');
        await fetchFrontApi().post<{ success: boolean }>({
            resource: 'session',
            headers: {
                'Content-Type': 'application/json',
                'Set-cookie': cookieHeader,
                [APP_API_KEY_HEADER]: process.env.APP_API_KEY || ''
            },
            body: user
        });
        return { success: true };
    } catch (error) {
        console.error("Error setting user session:", error);
        return { success: false };
    }
}


export const getFriendlyApiErrors = (errors: ErrorResponse): string[] => {
    if (errors.error.status_code === 500) {
        return ["An unexpected error occurred. Please try again later."];
    }
    return errors.error.errors;
}