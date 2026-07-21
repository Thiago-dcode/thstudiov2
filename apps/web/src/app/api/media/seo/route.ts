import type { Media } from "@repo/common-lib/types/media";
import { type NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getBackendHeaders } from "@/app/api/_helpers/backend-headers";
import { parseBackendResponse } from "@/app/api/_helpers/parse-backend-response";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export async function POST(request: NextRequest) {
  const t = await getTranslations();
  const session = await userSession();
  if (!session) {
    return NextResponse.json(
      { data: null, errors: [t("actions.unauthorized")] },
      { status: 401 },
    );
  }

  try {
    const input = await request.json();

    if (!input.user_id || !input.media_id) {
      const inputErrors: Record<string, string> = {};
      if (!input.user_id)
        inputErrors.user_id = t("validation.required", {
          field: t("fields.userId"),
        });
      if (!input.media_id)
        inputErrors.media_id = t("validation.required", {
          field: t("fields.mediaId"),
        });
      return NextResponse.json({
        data: null,
        errors: [t("actions.userIdAndMediaIdRequired")],
        inputErrors,
      });
    }

    const backendHeaders = await getBackendHeaders(session.token);

    const backendResponse = await fetch(
      `${backendHeaders.baseUrl}/ai/media/seo`,
      {
        method: "POST",
        headers: {
          ...backendHeaders.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_id: input.media_id,
          user_id: input.user_id,
        }),
      },
    );

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
    const message =
      error instanceof Error ? error.message : t("actions.unexpectedError");
    return NextResponse.json(
      { data: null, errors: [message] },
      { status: 500 },
    );
  }
}
