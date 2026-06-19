import type {
  CreateMediaInputWithFile,
  Media,
  MediaWithUser,
  UpdateMediaInput,
} from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class MediaService extends BaseService {
  constructor() {
    super(fetchApi(), "media");
  }
  async findAll(): Promise<ApiResponse<Media[]>> {
    return await this.fetchApi.get();
  }
  async getByPublicId(publicId: string): Promise<ApiResponse<MediaWithUser>> {
    return await this.fetchApi.get({
      resource: `/${publicId}`,
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
