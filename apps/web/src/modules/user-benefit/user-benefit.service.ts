import { BaseService } from "@/lib/services/base.service";
import { fetchApi } from "@/lib/facade/fetchApi";
import { ApiResponse } from "@repo/common-lib/types/response";
import { BenefitWithRedeemed } from "@repo/common-lib/types/benefit";

class UserBenefitService extends BaseService {
    constructor() {
        super(fetchApi(), 'users');
    }

    async getByUserId(userId: number): Promise<ApiResponse<BenefitWithRedeemed>> {
        return await this.fetchApi.get({
            resource: `${userId}/benefits`,
        });
    }
}

export default new UserBenefitService();
