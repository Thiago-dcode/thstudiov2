import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type { Media } from "@repo/common-lib/types/media";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { getBackendHeaders } from "@/app/api/_helpers/backend-headers";
import { parseBackendResponse } from "@/app/api/_helpers/parse-backend-response";
import { getObjErrorFromZod } from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { createMediaSchema } from "@/modules/media/schemas/media-shemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const session = await userSession();
  if (!session) {
    return NextResponse.json(
      { data: null, errors: ["Unauthorized"] },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: { file: "File is required" },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: { file: "File size must be less than 10MB" },
      });
    }

    if (!ALLOWED_IMAGE_FILE_TYPES.includes(file.type as MimeTypes)) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: { file: "File must be an image (JPEG, PNG or WebP)" },
      });
    }

    const dataToValidate: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key === "file") continue;
      if (key === "user_id") {
        dataToValidate[key] = Number(value);
      } else {
        dataToValidate[key] = value;
      }
    }

    trimValues(dataToValidate, { deep: true });

    const validated = createMediaSchema.safeParse(dataToValidate);
    if (!validated.success) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: getObjErrorFromZod(validated.error),
      });
    }

    const { compression_level, ...rest } = validated.data;

    const backendFormData = new FormData();
    backendFormData.append("file", file);
    backendFormData.append("seo_filename", rest.seo_filename);
    backendFormData.append("user_id", String(rest.user_id));
    if (rest.title) backendFormData.append("title", rest.title);
    if (rest.description)
      backendFormData.append("description", rest.description);
    if (rest.seo_alt) backendFormData.append("seo_alt", rest.seo_alt);
    if (rest.seo_title) backendFormData.append("seo_title", rest.seo_title);
    if (rest.seo_description)
      backendFormData.append("seo_description", rest.seo_description);
    if (compression_level)
      backendFormData.append("compression_level", compression_level);

    const backendHeaders = await getBackendHeaders(session.token);

    const backendResponse = await fetch(`${backendHeaders.baseUrl}/media`, {
      method: "POST",
      headers: backendHeaders.headers,
      body: backendFormData,
    });

    const result = await parseBackendResponse<Media>(backendResponse);

    if (result.errors) {
      return NextResponse.json({ data: null, errors: result.errors });
    }

    revalidateTag(`user-${rest.user_id}`, "max");
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
