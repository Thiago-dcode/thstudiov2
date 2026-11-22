"use server";

import type {
  ModuleStatus,
  ModuleStatusInput,
} from "@repo/common-lib/types/module-status";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { runModuleStatusAction } from "@/lib/server-actions/module-actions.server";
import collectionService from "../collection.service";

export const updateCollectionStatusAction = async (
  id: number,
  input: ModuleStatusInput,
): Promise<ActionReturn<ModuleStatus>> =>
  runModuleStatusAction(
    {
      operation: "collection-status-update",
      subject: "Collection",
      idKey: "collection_id",
      update: (i, body) => collectionService.updateStatus(i, body),
    },
    id,
    input,
  );
