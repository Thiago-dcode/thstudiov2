"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { errorName, webLogger, withLogTrace } from "@/lib/logging/logger";
import { sortModulesSchema } from "@/lib/validation/sort-modules.schema";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import portfolioService from "../portfolio.service";

const LOG_FIELDS = { operation: "portfolio-reorder" };

export const sortPortfoliosAction = async (
  items: SortModuleItem[],
): Promise<ActionReturn<boolean>> =>
  withLogTrace(
    async () => {
      const session = await requireSession();
      if (!session) {
        return await unauthorizedActionReturn<boolean>();
      }

      // Counts only: never the items themselves.
      const info = { item_count: Array.isArray(items) ? items.length : 0 };
      const t = await getTranslations();
      const validated = sortModulesSchema(t).safeParse(items);
      if (!validated.success) {
        webLogger.warn("Portfolio reorder invalid payload", {
          ...info,
          reason: "schema",
          ...LOG_FIELDS,
        });
        return {
          data: null,
          errors: [...new Set(validated.error.issues.map((i) => i.message))],
        };
      }

      let step = "api";
      try {
        const response = await portfolioService.sort(validated.data);
        if (response.error) {
          webLogger.warn("Portfolio reorder rejected", {
            ...info,
            api_error_code: response.error.api_error_code ?? null,
            status_code: response.error.status_code,
            ...LOG_FIELDS,
          });
          return {
            data: null,
            errors: await getFriendlyApiErrors(response),
          };
        }

        step = "refresh";
        refresh();

        webLogger.success("Portfolio reorder completed", {
          ...info,
          ...LOG_FIELDS,
        });
        return { data: true, errors: null };
      } catch (error) {
        webLogger.error("Portfolio reorder failed", {
          ...info,
          step,
          error_name: errorName(error),
          ...LOG_FIELDS,
        });
        throw error;
      }
    },
    { kind: "action" },
  );
