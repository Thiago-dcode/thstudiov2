import { APP_API_KEY_HEADER } from "@repo/common-lib/constants/constants";
import { UserAuth } from "./auth.types";
import { fetchFrontApi } from "@/lib/facade/fetchApi";
import { cookies } from "next/headers";
import { ErrorResponse } from "@repo/common-lib/types/response";
import type { ZodError } from "zod";
import { serverEnv } from "@/env/server";

export const setUserSessionApi = async (user: UserAuth): Promise<{ success: boolean }> => {
    try {
        const cookieStore = await cookies();
        const cookieHeader = cookieStore.getAll()
            .map(c => `${c.name}=${c.value}`)
            .join('; ');
        await fetchFrontApi().post<{ success: boolean }>({
            resource: 'session',
            headers: {
                'Content-Type': 'application/json',
                'Set-cookie': cookieHeader,
                [APP_API_KEY_HEADER]: serverEnv.APP_API_KEY
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


export const getObjErrorFromZod = (error: ZodError): Record<string, string> => {
    return error.issues.reduce((acc, issue) => {
        const field = issue.path.join('.');
        if (field) acc[field] = issue.message;
        return acc;
    }, {} as Record<string, string>);
}