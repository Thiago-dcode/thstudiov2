import type { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { type NextRequest, NextResponse } from "next/server";
import { getBackendHeaders } from "@/app/api/_helpers/backend-headers";
import { parseBackendResponse } from "@/app/api/_helpers/parse-backend-response";
import { getObjErrorFromZod } from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { updateMediaSchema } from "@/modules/media/schemas/media-shemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await userSession();
  if (!session) {
    return NextResponse.json(
      { data: null, errors: ["Unauthorized"] },
      { status: 401 },
    );
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({
        data: null,
        errors: ["Invalid media ID"],
      });
    }

    const input = await request.json();

    trimValues(input, { deep: true });

    const validated = updateMediaSchema.safeParse(input);
    if (!validated.success) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: getObjErrorFromZod(validated.error),
      });
    }

    const cleanedData: UpdateMediaInput = {};
    Object.entries(validated.data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        cleanedData[key as keyof UpdateMediaInput] = value as any;
      }
    });
    cleanObj(cleanedData);

    if (!Object.keys(cleanedData).length) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: { _form: "No fields to update" },
      });
    }

    const backendHeaders = await getBackendHeaders(session.token);

    const backendResponse = await fetch(
      `${backendHeaders.baseUrl}/media/${id}`,
      {
        method: "PATCH",
        headers: {
          ...backendHeaders.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
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
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { data: null, errors: [message] },
      { status: 500 },
    );
  }
}
