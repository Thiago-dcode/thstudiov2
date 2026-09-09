"use server";

import { revalidateTag } from "next/cache";
import { isSessionOwner, requireSession } from "@/modules/auth/helpers";

/**
 * Busts the `user-${id}` cache tag after a media mutation, which the upload route handler used
 * to do before the browser started calling the API directly.
 *
 * The tag does not cover the media grid itself — `usersService.getAllMedia` is `no-cache` and
 * untagged. What it covers is the user's cached categories and the metrics/subscription query,
 * i.e. `storage_used_mb` and the AI credit budget. Without this the create dialog keeps gating
 * on a storage figure from before the upload.
 *
 * Ownership is checked because, unlike the route handler this replaces, a server action takes
 * whatever id the caller passes — nobody gets to revalidate another user's tag.
 */
export const revalidateUserMediaAction = async (
  userId: number,
): Promise<void> => {
  const session = await requireSession();
  if (!isSessionOwner(session, userId)) return;

  revalidateTag(`user-${userId}`, "max");
};
