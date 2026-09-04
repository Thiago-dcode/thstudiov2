import {
  ALLOWED_FILE_TYPES,
  MAX_IMAGE_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB,
} from "@repo/common-lib/constants/limits";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type { Media } from "@repo/common-lib/types/media";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getBackendHeaders } from "@/app/api/_helpers/backend-headers";
import { parseBackendResponse } from "@/app/api/_helpers/parse-backend-response";
import { getObjErrorFromZod } from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { createMediaSchema } from "@/modules/media/schemas/media-shemas";

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: {
          file: t("validation.required", { field: t("fields.file") }),
        },
      });
    }

    if (!MediaHelper.getMediaTypeFromMimeType(file.type)) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: {
          file: t("validation.file.invalidType", { field: t("fields.file") }),
        },
      });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type.toLowerCase() as MimeTypes)) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: {
          file: t("validation.file.invalidType", { field: t("fields.file") }),
        },
      });
    }

    if (!MediaHelper.allowedFileSize(file)) {
      return NextResponse.json({
        data: null,
        errors: [],
        inputErrors: {
          file: t("validation.file.tooLarge", {
            field: t("fields.file"),
            // `allowedFileSize` above applies a per-type cap, so the message has to quote the
            // one that actually rejected this file — telling someone their 30MB video exceeds
            // 25MB when the video limit is 300MB just sends them in circles.
            mb:
              MediaHelper.getMediaTypeFromMimeType(file.type) === "VIDEO"
                ? MAX_VIDEO_UPLOAD_MB
                : MAX_IMAGE_UPLOAD_MB,
          }),
        },
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

    const { compression_level, generate_metadata, ...rest } = validated.data;

    const backendFormData = new FormData();
    backendFormData.append("file", file);
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
    // Only sent when explicitly requested: the backend's `@IsOptional()` treats an absent field as
    // "no AI generation", so forwarding `"false"` would be equivalent but noisier.
    if (generate_metadata) backendFormData.append("generate_metadata", "true");

    const backendHeaders = await getBackendHeaders(session.token);

    const backendResponse = await fetch(
      `${backendHeaders.baseUrl}/media/async`,
      {
        method: "POST",
        headers: backendHeaders.headers,
        body: backendFormData,
      },
    );

    const result = await parseBackendResponse<Media>(backendResponse);

    if (result.errors) {
      // Never forward an empty list: the client has nothing to render and falls back to a
      // meaningless generic message (see `extractReturnError` in the media provider).
      return NextResponse.json({
        data: null,
        errors: result.errors.length
          ? result.errors
          : [t("actions.genericError")],
      });
    }

    revalidateTag(`user-${rest.user_id}`, "max");
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
