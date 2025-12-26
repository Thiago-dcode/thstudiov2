import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";
import { PaymentMethod, PaymentMethodIndexRequest } from "@repo/common-lib/types/payment-method";
import { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

 class UtilsService extends BaseService {
    constructor() {
       super(fetchApi(), 'utils');
    }

    async getPaymentMethods(request?: PaymentMethodIndexRequest):Promise<ApiResponse<PaymentMethod[]>> {
        return await this.fetchApi.get({
            resource: queryParamBuilder('payment-methods', request)
        });
    }
}

let UtilsServiceInstance: UtilsService | null = null;

export default (() => {
    if (!UtilsServiceInstance) {
        UtilsServiceInstance = new UtilsService();
    }
    return UtilsServiceInstance;
})();