import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";

class MediaService extends BaseService {
    constructor() {
        super(fetchApi, 'media');
    }
    async findAll(): Promise<ApiResponse<any>> {
        return await this.fetchApi.get({
            resource: '',
        });
    }
}

export default new MediaService();