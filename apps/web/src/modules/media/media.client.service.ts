"use client";

import type {
  CreateMediaUploadUrl,
  CreateMediaUploadUrlInput,
  Media,
  UpdateMediaInput,
} from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { clientFetchApi } from "@/lib/facade/clientFetchApi";
import { ClientBaseService } from "@/lib/services/client-base.service";
import type { CreateMediaSchemaType } from "./schemas/media-shemas";

/**
 * Exactly what `CreateMediaAsyncRequest` accepts on the wire. No `file` here — the bytes went
 * straight to S3 via a presigned PUT (`createUploadUrl` below); this only claims that upload.
 */
export type CreateMediaBody = CreateMediaSchemaType & {
  upload_id: string;
  original_name: string;
  content_type: string;
};

/**
 * Browser-side twin of `media.service.ts`, covering only the endpoints the atelier calls
 * directly from the page. The upload no longer transits the Next server, which had to buffer
 * the whole file twice — once to parse the multipart body, once to re-encode it for the API —
 * nor does it transit this API process at all: `createMediaApi` (`api/media-api.client.ts`)
 * calls `createUploadUrl` for a presigned S3 URL, PUTs the file straight there, and only then
 * calls `createAsync` with the resulting `upload_id`. Neither body below ever carries a `File`,
 * so `HttpClient.parseBody` always sends plain JSON here, never `FormData`.
 */
class MediaClientService extends ClientBaseService {
  constructor() {
    super(clientFetchApi(), "media");
  }

  async createUploadUrl(
    body: CreateMediaUploadUrlInput,
  ): Promise<ApiResponse<CreateMediaUploadUrl>> {
    return await this.send(() =>
      this.fetchApi.post({ resource: "/upload-url", body }),
    );
  }

  async createAsync(body: CreateMediaBody): Promise<ApiResponse<Media>> {
    return await this.send(() =>
      this.fetchApi.post({ resource: "/async", body }),
    );
  }

  async updateAsync(
    id: number,
    body: UpdateMediaInput,
  ): Promise<ApiResponse<Media>> {
    return await this.send(() =>
      this.fetchApi.patch({ resource: `/${id}/async`, body }),
    );
  }
}

export default new MediaClientService();
