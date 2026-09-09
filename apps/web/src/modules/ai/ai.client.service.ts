"use client";

import type { GenerateMediaMetadataInput } from "@repo/common-lib/types/ai";
import type { Media } from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { clientFetchApi } from "@/lib/facade/clientFetchApi";
import { ClientBaseService } from "@/lib/services/client-base.service";

/**
 * Browser-side twin of `ai.service.ts`, for the SEO generation the media grid triggers.
 *
 * The body must stay JSON: `GenerateMediaMetadataRequest` validates `media_id`/`user_id` with a
 * bare `@IsNumber()` and no coercion, so the multipart round trip that turns every field into a
 * string would be rejected. `HttpClient.parseBody` only reaches for FormData when the body
 * contains a `File`, so this stays JSON on its own.
 */
class AiClientService extends ClientBaseService {
  constructor() {
    super(clientFetchApi(), "ai");
  }

  async generateMediaMetadata(
    body: GenerateMediaMetadataInput,
  ): Promise<ApiResponse<Media>> {
    return await this.send(() =>
      this.fetchApi.post({ resource: "media/metadata", body }),
    );
  }
}

export default new AiClientService();
