"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { runSortModulesAction } from "@/lib/server-actions/module-actions.server";
import portfolioService from "../portfolio.service";

export const sortPortfoliosAction = async (
  items: SortModuleItem[],
): Promise<ActionReturn<boolean>> =>
  runSortModulesAction(
    {
      operation: "portfolio-reorder",
      subject: "Portfolio",
      sort: (validated) => portfolioService.sort(validated),
    },
    items,
  );
