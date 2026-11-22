"use server";

import type {
  ModuleStatus,
  ModuleStatusInput,
} from "@repo/common-lib/types/module-status";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { runModuleStatusAction } from "@/lib/server-actions/module-actions.server";
import portfolioService from "../portfolio.service";

export const updatePortfolioStatusAction = async (
  id: number,
  input: ModuleStatusInput,
): Promise<ActionReturn<ModuleStatus>> =>
  runModuleStatusAction(
    {
      operation: "portfolio-status-update",
      subject: "Portfolio",
      idKey: "portfolio_id",
      update: (i, body) => portfolioService.updateStatus(i, body),
    },
    id,
    input,
  );
