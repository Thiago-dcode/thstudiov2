import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";
import { GetMediaSeoInput } from "@repo/common-lib/types/ai";
import { Media } from "@repo/common-lib/types/media";
import { ApiResponse } from "@repo/common-lib/types/response";

class AiService extends BaseService {
    constructor() {
        super(fetchApi(), 'ai');
    }

    async getMediaSeo(body?: GetMediaSeoInput): Promise<ApiResponse<Media>> {
        return await this.fetchApi.post({
            resource: 'media/seo',
            body
        });
    }
}

let AiServiceInstance: AiService | null = null;

export default (() => {
    if (!AiServiceInstance) {
        AiServiceInstance = new AiService();
    }
    return AiServiceInstance;
})();