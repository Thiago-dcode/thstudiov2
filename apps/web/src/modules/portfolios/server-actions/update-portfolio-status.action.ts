"use server";

import type {
  ModuleStatus,
  ModuleStatusInput,
} from "@repo/common-lib/types/module-status";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { errorName, webLogger, withLogTrace } from "@/lib/logging/logger";
import { moduleStatusSchema } from "@/lib/validation/module-status.schema";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import portfolioService from "../portfolio.service";

const LOG_FIELDS = { operation: "portfolio-status-update" };

export const updatePortfolioStatusAction = async (
  id: number,
  input: ModuleStatusInput,
): Promise<ActionReturn<ModuleStatus>> =>
  withLogTrace(
    async () => {
      const session = await requireSession();
      if (!session) {
        return await unauthorizedActionReturn<ModuleStatus>();
      }

      const info = { portfolio_id: id };
      const t = await getTranslations();
      const validated = moduleStatusSchema(t).safeParse(input);
      if (!validated.success) {
        webLogger.warn("Portfolio status update invalid payload", {
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
        const response = await portfolioService.updateStatus(
          id,
          validated.data,
        );
        if (response.error) {
          webLogger.warn("Portfolio status update rejected", {
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

        webLogger.success("Portfolio status update completed", {
          ...info,
          ...LOG_FIELDS,
        });
        return { data: response.data, errors: null };
      } catch (error) {
        webLogger.error("Portfolio status update failed", {
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
