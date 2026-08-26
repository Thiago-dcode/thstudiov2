"use client";

import { useFormatter } from "next-intl";
import { useCallback } from "react";

const DATE_TIME_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
} as const;

/**
 * Absolute date + time in the active locale, as the atelier lists render timestamps.
 *
 * Null-safe on purpose: most of these columns are optional (`read_at`, a record that was never
 * updated), so callers would otherwise repeat the same guard around every call.
 */
export const useDateTimeFormat = () => {
  const format = useFormatter();

  return useCallback(
    (value?: Date | string | null) =>
      value ? format.dateTime(new Date(value), DATE_TIME_FORMAT) : null,
    [format],
  );
};
