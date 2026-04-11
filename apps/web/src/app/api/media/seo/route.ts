import { NextRequest, NextResponse } from "next/server";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { Media } from "@repo/common-lib/types/media";
import { getBackendHeaders } from "@/app/api/_helpers/backend-headers";
import { parseBackendResponse } from "@/app/api/_helpers/parse-backend-response";

export async function POST(request: NextRequest) {
    const session = await userSession();
    if (!session) {
        return NextResponse.json(
            { data: null, errors: ["Unauthorized"] },
            { status: 401 }
        );
    }

    try {
        const input = await request.json();

        if (!input.user_id || !input.media_id) {
            const inputErrors: Record<string, string> = {};
            if (!input.user_id) inputErrors.user_id = "User ID is required";
            if (!input.media_id) inputErrors.media_id = "Media ID is required";
            return NextResponse.json({
                data: null,
                errors: ["user_id and media_id are required"],
                inputErrors,
            });
        }

        const backendHeaders = await getBackendHeaders(session.token);

        const backendResponse = await fetch(`${backendHeaders.baseUrl}/ai/media/seo`, {
            method: "POST",
            headers: {
                ...backendHeaders.headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                media_id: input.media_id,
                user_id: input.user_id,
            }),
        });

        const result = await parseBackendResponse<Media>(backendResponse);

        if (result.errors) {
            return NextResponse.json({ data: null, errors: result.errors });
        }

        return NextResponse.json({
            data: result.data,
            errors: null,
            inputErrors: undefined,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json(
            { data: null, errors: [message] },
            { status: 500 }
        );
    }
}
