import * as z from "zod";
import type { Translator } from "./zod-helpers";

/**
 * Quick status toggle shared by every module card: only `is_active`. `is_highlight` is no longer
 * editable from the web, and z.object strips it, so a client that still sends it never reaches the API.
 */
export const moduleStatusSchema = (t: Translator) => {
  const message = t("atelier.common.moduleCard.invalidStatus");
  return z.object({
    is_active: z.boolean(message),
  });
};
