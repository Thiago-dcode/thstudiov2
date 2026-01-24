import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { Media, CreateMediaInputWithFile, UpdateMediaInput } from "@repo/common-lib/types/media";


class MediaService extends BaseService {
    constructor() {
       super(fetchApi(), 'media');
    }
    async findAll(): Promise<ApiResponse<Media[]>> {
        return await this.fetchApi.get();
    }
    async create(body: CreateMediaInputWithFile): Promise<ApiResponse<Media>> {
        return await this.fetchApi.post({body});
    }
    async update(id: number, body: UpdateMediaInput): Promise<ApiResponse<Media>> {
        return await this.fetchApi.patch({
            resource: `/${id}`,
            body
        });
    }
}

export default new MediaService();