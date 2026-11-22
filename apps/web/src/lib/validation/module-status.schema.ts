import * as z from "zod";
import type { Translator } from "./zod-helpers";

/** Quick status toggles shared by every module with highlight/active flags: at least one field. */
export const moduleStatusSchema = (t: Translator) => {
  const message = t("atelier.common.moduleCard.invalidStatus");
  return z
    .object({
      is_highlight: z.boolean(message).optional(),
      is_active: z.boolean(message).optional(),
    })
    .refine(
      (value) =>
        value.is_highlight !== undefined || value.is_active !== undefined,
      message,
    );
};
