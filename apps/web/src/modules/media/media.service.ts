import type { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import type {
  CreateMediaInputWithFile,
  Media,
  MediaIndexRequest,
  MediaWithUser,
  UpdateMediaInput,
} from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import type { CacheOptions } from "@repo/frontend-lib/fetch/http-client";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class MediaService extends BaseService {
  constructor() {
    super(fetchApi(), "media");
  }
  async findAll(request?: MediaIndexRequest): Promise<ApiResponse<Media[]>> {
    return await this.fetchApi.get({
      resource: request ? queryParamBuilder("", request) : "",
    });
  }

  /**
   * `cacheOptions` is a parameter rather than a hardcoded value because the filters vary per
   * caller: a future caller passing a user-specific or paginated filter must not silently
   * inherit a cache window sized for the landing page's fixed query.
   */
  async findAllWithUser(
    request: MediaIndexRequest = {},
    cacheOptions?: CacheOptions,
  ): Promise<ApiResponse<MediaWithUser[]>> {
    const filters: MediaIndexRequest = { ...request, compact: false };
    return await this.fetchApi.get({
      resource: queryParamBuilder("", filters),
      isPublic: true,
      cacheOptions,
    });
  }
  async getByPublicId(
    publicId: string,
    lang?: string,
  ): Promise<ApiResponse<MediaWithUser>> {
    return await this.fetchApi.get({
      resource: lang ? `/${publicId}?lan=${lang}` : `/${publicId}`,
    });
  }
  async getSeoMetadata(
    publicId: string,
    lang: string,
  ): Promise<ApiResponse<EntitySeoMetadata | null>> {
    return await this.fetchApi.get({
      resource: `/${publicId}/metadata?lan=${lang}`,
    });
  }
  async create(body: CreateMediaInputWithFile): Promise<ApiResponse<Media>> {
    return await this.fetchApi.post({ body });
  }
  async update(
    id: number,
    body: UpdateMediaInput,
  ): Promise<ApiResponse<Media>> {
    return await this.fetchApi.patch({
      resource: `/${id}`,
      body,
    });
  }
  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetchApi.delete({
      resource: `/${id}`,
    });
  }
}

export default new MediaService();
