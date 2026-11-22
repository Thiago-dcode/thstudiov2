"use server";

import type {
  ModuleStatus,
  ModuleStatusInput,
} from "@repo/common-lib/types/module-status";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { runModuleStatusAction } from "@/lib/server-actions/module-actions.server";
import serviceService from "../service.service";

export const updateServiceStatusAction = async (
  id: number,
  input: ModuleStatusInput,
): Promise<ActionReturn<ModuleStatus>> =>
  runModuleStatusAction(
    {
      operation: "service-status-update",
      subject: "Service",
      idKey: "service_id",
      update: (i, body) => serviceService.updateStatus(i, body),
    },
    id,
    input,
  );
