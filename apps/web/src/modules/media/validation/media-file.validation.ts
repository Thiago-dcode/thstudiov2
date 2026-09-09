import {
  ALLOWED_FILE_TYPES,
  MAX_IMAGE_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB,
} from "@repo/common-lib/constants/limits";
import type { MimeTypes } from "@repo/common-lib/types/general";
import { MediaHelper } from "@repo/common-lib/utils/media";
import type { Translator } from "@/lib/validation/zod-helpers";

/**
 * Per-file checks that used to live in the Next upload route, run here now that the browser
 * posts straight to the API.
 *
 * Not redundant with `FileInputProvider`, which already rejects bad files before they can be
 * staged: the API's multer config applies a single flat ceiling (`MAX_VIDEO_UPLOAD_BYTES`) and
 * says so in its own comment — the *per-type* caps have always been enforced client-side. Drop
 * this and a 100MB PNG sails past every check.
 *
 * Returns an `inputErrors` map keyed on `file`, or `undefined` when the file is acceptable.
 * With no translator registered it returns `undefined` rather than an English literal, leaving
 * the caller's generic-error path to speak instead.
 */
export const validateMediaFile = (
  file: File | undefined,
  t: Translator | null,
): Record<string, string> | undefined => {
  if (!t) return undefined;

  if (!file || file.size === 0) {
    return { file: t("validation.required", { field: t("fields.file") }) };
  }

  const mediaType = MediaHelper.getMediaTypeFromMimeType(file.type);
  if (
    !mediaType ||
    !ALLOWED_FILE_TYPES.includes(file.type.toLowerCase() as MimeTypes)
  ) {
    return { file: t("validation.file.invalidType", { field: t("fields.file") }) };
  }

  if (!MediaHelper.allowedFileSize(file)) {
    return {
      file: t("validation.file.tooLarge", {
        field: t("fields.file"),
        // The cap that actually rejected this file: telling someone their 30MB video exceeds
        // the 25MB image limit just sends them in circles.
        mb: mediaType === "VIDEO" ? MAX_VIDEO_UPLOAD_MB : MAX_IMAGE_UPLOAD_MB,
      }),
    };
  }

  return undefined;
};
