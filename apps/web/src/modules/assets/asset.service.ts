import type { Asset } from "@repo/common-lib/types/assets";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class AssetService extends BaseService {
  constructor() {
    super(fetchApi(), "assets");
  }

  async getBySlug(slug: string): Promise<ApiResponse<Asset>> {
    return await this.fetchApi.get({
      resource: `/${slug}`,
    });
  }
}

export default new AssetService();
