"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { runSortModulesAction } from "@/lib/server-actions/module-actions.server";
import serviceService from "../service.service";

export const sortServicesAction = async (
  items: SortModuleItem[],
): Promise<ActionReturn<boolean>> =>
  runSortModulesAction(
    {
      operation: "service-reorder",
      subject: "Service",
      sort: (validated) => serviceService.sort(validated),
    },
    items,
  );
