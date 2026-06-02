import type { ApiResponse } from "@repo/common-lib/types/response";
import type {
  PublicCreateWaitListInput,
  WaitList,
  WaitListPosition,
} from "@repo/common-lib/types/wait-list";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class WaitListService extends BaseService {
  constructor() {
    super(fetchApi(), "wait-list");
  }

  async create(
    body: PublicCreateWaitListInput,
  ): Promise<ApiResponse<WaitList>> {
    return await this.fetchApi.post({
      resource: "",
      body,
    });
  }

  async getCurrentPosition(): Promise<ApiResponse<WaitListPosition>> {
    return await this.fetchApi.get({
      resource: "position",
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
