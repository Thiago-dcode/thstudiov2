import type { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class UserBenefitService extends BaseService {
 constructor() {
 super(fetchApi(), "users");
 }

 async getByUserId(userId: number): Promise<ApiResponse<BenefitWithRedeemed>> {
 return await this.fetchApi.get({
 resource: `${userId}/benefits`,
 });
 }
}

export default new UserBenefitService();
