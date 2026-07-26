import type { GenerateMediaMetadataInput } from "@repo/common-lib/types/ai";
import type { Media } from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class AiService extends BaseService {
  constructor() {
    super(fetchApi(), "ai");
  }

  async generateMediaMetadata(
    body?: GenerateMediaMetadataInput,
  ): Promise<ApiResponse<Media>> {
    return await this.fetchApi.post({
      resource: "media/metadata",
      body,
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
