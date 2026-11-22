"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { SortModuleItem } from "@repo/common-lib/types/sort-module";
import { runSortModulesAction } from "@/lib/server-actions/module-actions.server";
import collectionService from "../collection.service";

export const sortCollectionsAction = async (
  items: SortModuleItem[],
): Promise<ActionReturn<boolean>> =>
  runSortModulesAction(
    {
      operation: "collection-reorder",
      subject: "Collection",
      sort: (validated) => collectionService.sort(validated),
    },
    items,
  );
