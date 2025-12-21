import { NextRequest, NextResponse } from "next/server";
import { UserAuth } from "@/modules/auth/auth.types";
import { setUserSession, setUserSessionByCookie, userSession } from "@/modules/auth/server-actions/user-session.action";
import { API_KEY_HEADER } from "@repo/common-lib/constants/constants";

const API_KEY = process.env.API_KEY;

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get(API_KEY_HEADER);
        
        if (!apiKey || apiKey !== API_KEY) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json() as UserAuth;
        
        if (!body.token || !body.id) {
            return NextResponse.json(
                { error: "Invalid user auth data. Token and id are required." },
                { status: 400 }
            );
        }

 
        const response = NextResponse.json({ success: true }, { status: 200 });

        await setUserSessionByCookie(body,response.cookies);
        return response;
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to set user session" },
            { status: 500 }
        );
    }
}

