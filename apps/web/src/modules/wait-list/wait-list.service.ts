import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";
import { PublicCreateWaitListInput, WaitList } from "@repo/common-lib/types/wait-list";
import { ApiResponse } from "@repo/common-lib/types/response";

class WaitListService extends BaseService {
    constructor() {
        super(fetchApi(), 'wait-list');
    }

    async create(body: PublicCreateWaitListInput): Promise<ApiResponse<WaitList>> {
        return await this.fetchApi.post({
            resource: '',
            body,
        });
    }
}

let WaitListServiceInstance: WaitListService | null = null;

export default (() => {
    if (!WaitListServiceInstance) {
        WaitListServiceInstance = new WaitListService();
    }
    return WaitListServiceInstance;
})();
