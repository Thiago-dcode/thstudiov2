import type { EntitySeoMetadata } from "@repo/common-lib/types/ai";
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
    lang?: string,
  ): Promise<ApiResponse<FullCollection | null>> {
    return await this.fetchApi.get({
      resource: lang
        ? `/${username}/collections/${slug}?lan=${lang}`
        : `/${username}/collections/${slug}`,
    });
  }

  async getSeoMetadata(
    username: string,
    slug: string,
    lang: string,
  ): Promise<ApiResponse<EntitySeoMetadata | null>> {
    return await this.fetchApi.get({
      resource: `/${username}/collections/${slug}/metadata?lan=${lang}`,
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
}

export default new UserCollectionService();
