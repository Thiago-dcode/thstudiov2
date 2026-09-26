import { MediaHelper } from "@repo/common-lib/utils/media";
import type { UploadMedia } from "@/modules/media/providers/media.provider";
import type { AiCreditsInfo } from "@/modules/users/providers/user-metrics.provider";

/** Hard cap on how many files one selection may stage at a time. */
export const MAX_FILES = 10;

/**
 * AI credit cost of generating metadata for a staged file. A video costs more than an image,
 * so nothing that budgets credits may count items — it has to weigh them.
 */
export const creditCostOf = (
  upload: UploadMedia,
  aiCreditsInfo: AiCreditsInfo,
) =>
  aiCreditsInfo.costFor(
    MediaHelper.getMediaTypeFromMimeType(upload.input.file?.type ?? ""),
  );

/**
 * Credits the current staging selection has already committed, optionally ignoring one file.
 *
 * `exceptUniqueId` is what lets a per-file toggle ask "does *this* file still fit?" without
 * counting its own cost twice.
 */
export const creditsSpentBy = (
  uploads: UploadMedia[],
  aiCreditsInfo: AiCreditsInfo,
  exceptUniqueId?: number,
) =>
  uploads.reduce(
    (total, upload) =>
      upload.input.generate_metadata && upload.unique_id !== exceptUniqueId
        ? total + creditCostOf(upload, aiCreditsInfo)
        : total,
    0,
  );

/** The name shown on a staged card — the picked file's, with a translated fallback. */
export const stagedFileName = (upload: UploadMedia, fallback: string) =>
  upload.input.file?.name || upload.input.original_name || fallback;

/**
 * `unique_id`s of uploads that look like the same file as another upload in `uploads`: same
 * name AND same size in bytes.
 *
 * The name alone flagged every pair of unrelated "image.png"s; requiring the exact byte size too
 * leaves almost only real re-picks of one file. Renamed copies still slip through — hashing the
 * bytes would catch them but means reading every file, which this deliberately avoids.
 *
 * In-memory only, by design: this compares the pending batch against itself and never the
 * user's library, so it costs no request. The name match is case-insensitive, since "IMG_01.JPG"
 * and "img_01.jpg" are the same photo exported twice far more often than two different works.
 * A match is only a hint — the caller warns, it never blocks.
 */
export const possibleDuplicateIds = (uploads: UploadMedia[]) => {
  const idsByFile = new Map<string, number[]>();
  for (const upload of uploads) {
    const file = upload.input.file;
    const name = file?.name.trim().toLowerCase();
    if (!file || !name) continue;
    const key = `${name}:${file.size}`;
    idsByFile.set(key, [...(idsByFile.get(key) ?? []), upload.unique_id]);
  }

  const duplicates = new Set<number>();
  for (const ids of idsByFile.values()) {
    if (ids.length > 1) for (const id of ids) duplicates.add(id);
  }
  return duplicates;
};
