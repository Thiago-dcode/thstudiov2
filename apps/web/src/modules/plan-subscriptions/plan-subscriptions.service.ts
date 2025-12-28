import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";
import { HandleSubscriptionProcessResponse, InitiateSubscriptionRequest } from "@repo/common-lib/types/plan-subscription";
import { ApiResponse } from "@repo/common-lib/types/response";

 class PlansService extends BaseService {
    constructor() {
       super(fetchApi(), 'subscriptions');
    }

    async initiate(body?: InitiateSubscriptionRequest):Promise<ApiResponse<HandleSubscriptionProcessResponse>> {
       
        return await this.fetchApi.post({
            resource: 'initiate',
            body
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