import { MAX_SORT_MODULE_ITEMS } from "@repo/common-lib/constants/sort-module";
import * as z from "zod";
import type { Translator } from "./zod-helpers";

/**
 * Reorder payload shared by every sortable module: unique `module_id`s and unique, in-range
 * `position`s. One message for every issue, since the UI can only produce a bad order by a bug.
 */
export const sortModulesSchema = (t: Translator) => {
  const message = t("atelier.common.sortable.invalidOrder");
  return z
    .array(
      z.object({
        module_id: z.number(message).int(message).min(1, message),
        position: z
          .number(message)
          .int(message)
          .min(0, message)
          .max(MAX_SORT_MODULE_ITEMS - 1, message),
      }),
      message,
    )
    .min(1, message)
    .max(MAX_SORT_MODULE_ITEMS, message)
    .refine(
      (items) => new Set(items.map((i) => i.module_id)).size === items.length,
      message,
    )
    .refine(
      (items) => new Set(items.map((i) => i.position)).size === items.length,
      message,
    );
};
