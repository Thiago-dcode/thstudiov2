import type { GenerateManyMediaMetadataResult } from "@repo/common-lib/types/ai";
import type { Media } from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class AiService extends BaseService {
  constructor() {
    super(fetchApi(), "ai");
  }

  async generateMediaMetadata(mediaId: number): Promise<ApiResponse<Media>> {
    return await this.fetchApi.post({
      resource: `media/${mediaId}/metadata`,
    });
  }

  async generateManyMediaMetadata(
    mediaIds: number[],
  ): Promise<ApiResponse<GenerateManyMediaMetadataResult>> {
    return await this.fetchApi.post({
      resource: "media/metadata",
      body: { media: mediaIds },
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
