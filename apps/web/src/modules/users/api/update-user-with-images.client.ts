"use client";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  BaseUser,
  UpdateUserInputWithAssets,
} from "@repo/common-lib/types/user";
import { toActionReturn } from "@/lib/services/to-action-return";
import { uploadFileToStorage } from "@/modules/media/api/storage-upload.client";
import { updateUserAction } from "../server-actions/update-user.action";
import usersClientService from "../users.client.service";

const IMAGE_FIELDS = ["avatar", "banner"] as const;

type UpdateUserReturn = ActionReturn<BaseUser, UpdateUserInputWithAssets>;

/**
 * Where an image submit is: the PUT to S3 (with its percent), then `processing` while the API
 * converts and moderates it — that second step takes seconds and reports no progress of its own.
 */
export type UserImageUploadStatus =
  | { phase: "uploading"; percent: number }
  | { phase: "processing" };

/**
 * `updateUserAction`, but with the form's `avatar` / `banner` files PUT straight to S3 first and
 * replaced by their `*_upload_id`s.
 *
 * Image bytes must never ride in a server-action body: Cloudflare's managed WAF rule for
 * CVE-2025-55183 inspects those bodies and blocks some images with a 403, which the user only
 * ever sees as "An unexpected response was received from the server". Same flow as media
 * uploads (`createMediaApi`).
 *
 * @param options.fallbackError - Translated message for failures that carry no user-facing text
 * (network errors, 5xx, a rejected S3 PUT).
 * @param options.onStatus - Only called when the form actually carries an image, so a text-only
 * profile edit never shows upload feedback.
 */
export async function updateUserWithImages(
  userId: number,
  formData: FormData,
  {
    fallbackError,
    onStatus,
  }: {
    fallbackError: string;
    onStatus?: (status: UserImageUploadStatus) => void;
  },
): Promise<UpdateUserReturn> {
  const failed = (errors?: string[] | null): UpdateUserReturn => ({
    data: null,
    errors: errors?.length ? errors : [fallbackError],
    inputErrors: undefined,
    inputs: undefined,
  });

  // Copied rather than edited in place: the caller's FormData is theirs.
  const payload = new FormData();
  for (const [key, value] of formData) {
    if (!(IMAGE_FIELDS as readonly string[]).includes(key)) {
      payload.append(key, value);
    }
  }

  let hasImage = false;
  for (const field of IMAGE_FIELDS) {
    const file = formData.get(field);
    // An untouched file input still submits an empty, nameless File.
    if (!(file instanceof File) || file.size === 0) continue;

    hasImage = true;
    onStatus?.({ phase: "uploading", percent: 0 });
    const presigned = await usersClientService.createImageUploadUrl(userId, {
      content_type: file.type,
      size: file.size,
    });
    if (presigned.error) {
      return failed(toActionReturn(presigned).errors);
    }

    const uploaded = await uploadFileToStorage(
      presigned.data.upload_url,
      file,
      (percent) => onStatus?.({ phase: "uploading", percent }),
    );
    if (!uploaded.ok) return failed();

    payload.set(`${field}_upload_id`, presigned.data.upload_id);
  }

  if (hasImage) onStatus?.({ phase: "processing" });
  return await updateUserAction(userId, payload);
}
