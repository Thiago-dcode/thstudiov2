import type { FullPlan, PlanIndexRequest } from "@repo/common-lib/types/plan";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class PlansService extends BaseService {
 constructor() {
 super(fetchApi(), "plans");
 }

 async getAll(request?: PlanIndexRequest): Promise<ApiResponse<FullPlan[]>> {
 return await this.fetchApi.get({
 resource: request ? queryParamBuilder("", request) : "",
 });
 }
}

let PlanServiceInstance: PlansService | null = null;

export default (() => {
 if (!PlanServiceInstance) {
 PlanServiceInstance = new PlansService();
 }
 return PlanServiceInstance;
})();
