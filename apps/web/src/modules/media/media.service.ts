import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { Media, CreateMediaInputWithFile } from "@repo/common-lib/types/media";


class MediaService extends BaseService {
    constructor() {
       super(fetchApi(), 'media');
    }
    async findAll(): Promise<ApiResponse<Media[]>> {
        return await this.fetchApi.get({
            resource: '',
        });
    }
    async create(body: CreateMediaInputWithFile): Promise<ApiResponse<Media>> {
        return await this.fetchApi.post({
            resource: '',
            body
        });
    }
}

export default new MediaService();