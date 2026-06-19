import type {
 HandleSubscriptionProcessResponse,
 InitiateSubscriptionRequest,
} from "@repo/common-lib/types/plan-subscription";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

type CustomerPortalRequest = {
 return_url: string;
};

type CustomerPortalResponse = {
 url: string;
};

class PlansService extends BaseService {
 constructor() {
 super(fetchApi(), "subscriptions");
 }

 async initiate(
 body?: InitiateSubscriptionRequest,
 ): Promise<ApiResponse<HandleSubscriptionProcessResponse>> {
 return await this.fetchApi.post({
 resource: "initiate",
 body,
 });
 }

 async portal(
 body: CustomerPortalRequest,
 ): Promise<ApiResponse<CustomerPortalResponse>> {
 return await this.fetchApi.post({
 resource: "portal",
 body,
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
