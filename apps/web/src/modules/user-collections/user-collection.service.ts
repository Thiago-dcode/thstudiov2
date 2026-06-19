import type {
  Collection,
  CollectionIndexRequest,
  FullCollection,
} from "@repo/common-lib/types/collection";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class UserCollectionService extends BaseService {
  constructor() {
    super(fetchApi(), "users");
  }

  async getById(
    userId: number,
    slug: string,
  ): Promise<ApiResponse<FullCollection | null>> {
    return await this.fetchApi.get({
      resource: `/${userId}/collection/${slug}`,
    });
  }

  async getByUsername(
    username: string,
    slug: string,
  ): Promise<ApiResponse<FullCollection | null>> {
    return await this.fetchApi.get({
      resource: `/${username}/collections/${slug}`,
    });
  }

  async getAllByUsername(
    username: string,
    filters?: Omit<CollectionIndexRequest, "user_id">,
  ): Promise<ApiResponse<Collection[]>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder(`/${username}/collections`, filters),
    });
  }

  async slugExists(
    username: string,
    slug: string,
  ): Promise<ApiResponse<{ exists: boolean }>> {
    return await this.fetchApi.get({
      resource: `/${username}/collection/slug-exist/${slug}`,
    });
  }
}

export default new UserCollectionService();
