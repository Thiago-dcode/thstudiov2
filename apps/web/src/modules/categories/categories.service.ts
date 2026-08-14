import { CACHE_KEY_ACTIVE_CATEGORIES } from "@repo/common-lib/constants/constants";
import type {
  CategoryBase,
  CategoryIndexRequest,
} from "@repo/common-lib/types/category";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class CategoryService extends BaseService {
  constructor() {
    super(fetchApi(), "categories");
  }

  async getAll(
    request?: CategoryIndexRequest,
  ): Promise<ApiResponse<CategoryBase[]>> {
    return await this.fetchApi.get({
      resource: request ? queryParamBuilder("", request) : "",
    });
  }

  /**
   * Public catalog of active categories (no thumbnails). Admin-curated and language-independent,
   * so this is cached rather than re-fetched on every render. `isPublic` keeps the Next data-cache
   * key stable (no per-visitor session/UA/IP headers).
   */
  async getAllActive(): Promise<
    ApiResponse<Omit<CategoryBase, "thumbnail">[]>
  > {
    return await this.fetchApi.get({
      resource: "/active",
      isPublic: true,
      cacheOptions: {
        next: {
          revalidate: 60 * 60 * 24,
          tags: [CACHE_KEY_ACTIVE_CATEGORIES],
        },
      },
    });
  }
}

let CategoryServiceInstance: CategoryService | null = null;

export default (() => {
  if (!CategoryServiceInstance) {
    CategoryServiceInstance = new CategoryService();
  }
  return CategoryServiceInstance;
})();
