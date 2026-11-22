import "server-only";

import type {
  ModuleStatus,
  ModuleStatusInput,
} from "@repo/common-lib/types/module-status";
import type {
  ActionReturn,
  ApiResponse,
} from "@repo/common-lib/types/response";
import type {
  SortModuleItem,
  SortModulesResult,
} from "@repo/common-lib/types/sort-module";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { errorName, webLogger, withLogTrace } from "@/lib/logging/logger";
import { moduleStatusSchema } from "@/lib/validation/module-status.schema";
import { sortModulesSchema } from "@/lib/validation/sort-modules.schema";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";

/**
 * Shared bodies of the atelier "reorder" and "quick status" server actions (portfolios, collections,
 * later services). Not a `"use server"` file: it exports helpers that take functions. Each module's
 * `"use server"` action file calls these. `subject` and `idKey` are code constants, never user input,
 * so the log messages stay a bounded set.
 */

export type SortModulesActionConfig = {
  operation: string;
  subject: string;
  sort: (items: SortModuleItem[]) => Promise<ApiResponse<SortModulesResult>>;
};

export type ModuleStatusActionConfig = {
  operation: string;
  subject: string;
  idKey: string;
  update: (
    id: number,
    input: ModuleStatusInput,
  ) => Promise<ApiResponse<ModuleStatus>>;
};

export const runSortModulesAction = async (
  config: SortModulesActionConfig,
  items: SortModuleItem[],
): Promise<ActionReturn<boolean>> =>
  withLogTrace(
    async () => {
      const session = await requireSession();
      if (!session) {
        return await unauthorizedActionReturn<boolean>();
      }

      const logFields = { operation: config.operation };
      // Counts only: never the items themselves.
      const info = { item_count: Array.isArray(items) ? items.length : 0 };
      const t = await getTranslations();
      const validated = sortModulesSchema(t).safeParse(items);
      if (!validated.success) {
        webLogger.warn(`${config.subject} reorder invalid payload`, {
          ...info,
          reason: "schema",
          ...logFields,
        });
        return {
          data: null,
          errors: [...new Set(validated.error.issues.map((i) => i.message))],
        };
      }

      let step = "api";
      try {
        const response = await config.sort(validated.data);
        if (response.error) {
          webLogger.warn(`${config.subject} reorder rejected`, {
            ...info,
            api_error_code: response.error.api_error_code ?? null,
            status_code: response.error.status_code,
            ...logFields,
          });
          return {
            data: null,
            errors: await getFriendlyApiErrors(response),
          };
        }

        step = "refresh";
        refresh();

        webLogger.success(`${config.subject} reorder completed`, {
          ...info,
          ...logFields,
        });
        return { data: true, errors: null };
      } catch (error) {
        webLogger.error(`${config.subject} reorder failed`, {
          ...info,
          step,
          error_name: errorName(error),
          ...logFields,
        });
        throw error;
      }
    },
    { kind: "action" },
  );

export const runModuleStatusAction = async (
  config: ModuleStatusActionConfig,
  id: number,
  input: ModuleStatusInput,
): Promise<ActionReturn<ModuleStatus>> =>
  withLogTrace(
    async () => {
      const session = await requireSession();
      if (!session) {
        return await unauthorizedActionReturn<ModuleStatus>();
      }

      const logFields = { operation: config.operation };
      const info = { [config.idKey]: id };
      const t = await getTranslations();

      // Key names only, never values.
      const fields =
        input && typeof input === "object" ? Object.keys(input).join(",") : "";

      if (!Number.isInteger(id) || id < 1) {
        webLogger.warn(`${config.subject} status update invalid payload`, {
          ...info,
          fields,
          reason: "id",
          ...logFields,
        });
        return {
          data: null,
          errors: [t("atelier.common.moduleCard.invalidStatus")],
        };
      }

      const validated = moduleStatusSchema(t).safeParse(input);
      if (!validated.success) {
        webLogger.warn(`${config.subject} status update invalid payload`, {
          ...info,
          fields,
          reason: "schema",
          ...logFields,
        });
        return {
          data: null,
          errors: [...new Set(validated.error.issues.map((i) => i.message))],
        };
      }

      let step = "api";
      try {
        const response = await config.update(id, validated.data);
        if (response.error) {
          webLogger.warn(`${config.subject} status update rejected`, {
            ...info,
            api_error_code: response.error.api_error_code ?? null,
            status_code: response.error.status_code,
            ...logFields,
          });
          return {
            data: null,
            errors: await getFriendlyApiErrors(response),
          };
        }

        step = "refresh";
        refresh();

        webLogger.success(`${config.subject} status update completed`, {
          ...info,
          ...logFields,
        });
        return { data: response.data, errors: null };
      } catch (error) {
        webLogger.error(`${config.subject} status update failed`, {
          ...info,
          step,
          error_name: errorName(error),
          ...logFields,
        });
        throw error;
      }
    },
    { kind: "action" },
  );
