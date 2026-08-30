"use client";

import { useFormatter, useNow } from "next-intl";
import { useCallback } from "react";

/** How often the rendered labels re-tick. A minute is the smallest unit these lists show. */
const UPDATE_INTERVAL_MS = 60_000;

/**
 * Compact relative time ("2 hours ago") in the active locale, for lists where *how long ago*
 * matters more than the exact stamp. Pair it with {@link useDateTimeFormat} on a `title` so the
 * absolute value is still one hover away.
 *
 * `now` ticks on an interval so a label does not go stale while a panel stays open. Because no
 * global `now` is set in `i18n/request.ts`, server and client each read their own clock — fine for
 * client-only surfaces (a portalled drawer, a dialog), but give this a second look before using it
 * in server-rendered markup, where the two could round to different strings.
 *
 * Null-safe for the same reason as {@link useDateTimeFormat}: most of these columns are optional.
 */
export const useRelativeTimeFormat = () => {
  const format = useFormatter();
  const now = useNow({ updateInterval: UPDATE_INTERVAL_MS });

  return useCallback(
    (value?: Date | string | null) =>
      value ? format.relativeTime(new Date(value), now) : null,
    [format, now],
  );
};
