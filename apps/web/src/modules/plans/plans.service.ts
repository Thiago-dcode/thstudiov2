import type { FullPlan, PlanIndexRequest } from "@repo/common-lib/types/plan";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { landingCache } from "@/lib/config";
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

  /** The free plan, for marketing pages that state its limits. Public and cached like the landing. */
  async getFree(): Promise<ApiResponse<FullPlan>> {
    return await this.fetchApi.get({
      resource: "/free",
      isPublic: true,
      cacheOptions: landingCache("plan-free"),
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
