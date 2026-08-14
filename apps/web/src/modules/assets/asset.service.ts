import type { Asset } from "@repo/common-lib/types/assets";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { landingCache } from "@/lib/config";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class AssetService extends BaseService {
  constructor() {
    super(fetchApi(), "assets");
  }

  /**
   * Site assets (hero video, static imagery) are public and change only through the admin API,
   * so this is cached rather than re-fetched on every render. Before this, each landing page view
   * hit the API for the hero video, which is what tripped the rate limiter.
   */
  async getBySlug(slug: string): Promise<ApiResponse<Asset>> {
    return await this.fetchApi.get({
      resource: `/${slug}`,
      isPublic: true,
      cacheOptions: landingCache(`asset-${slug}`),
    });
  }
}

export default new AssetService();
