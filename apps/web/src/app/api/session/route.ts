import { getConfigValue } from "@repo/common-lib/config/utils";
import { APP_API_KEY_HEADER } from "@repo/common-lib/constants/constants";
import { type NextRequest, NextResponse } from "next/server";
import type { UserAuth } from "@/modules/auth/auth.types";
import {
  deleteUserSession,
  setUserSession,
} from "@/modules/auth/server-actions/user-session.action";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get(APP_API_KEY_HEADER);

    if (!apiKey || apiKey !== getConfigValue("app").api_key) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UserAuth;

    if (!body.token || !body.id) {
      return NextResponse.json(
        { error: "Invalid user auth data. Token and id are required." },
        { status: 400 },
      );
    }

    // Delete old session and set new one using cookies() from next/headers
    await deleteUserSession();
    await setUserSession(body);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to set user session" },
      { status: 500 },
    );
  }
}
