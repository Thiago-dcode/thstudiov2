import type { Layout, LayoutIndexRequest } from "@repo/common-lib/types/layout";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class LayoutsService extends BaseService {
  constructor() {
    super(fetchApi(), "layouts");
  }

  async getAll(
    request?: LayoutIndexRequest,
  ): Promise<ApiResponse<Layout[]>> {
    return await this.fetchApi.get({
      resource: request ? queryParamBuilder("", request) : "",
    });
  }
}

let LayoutsServiceInstance: LayoutsService | null = null;

export default (() => {
  if (!LayoutsServiceInstance) {
    LayoutsServiceInstance = new LayoutsService();
  }
  return LayoutsServiceInstance;
})();
