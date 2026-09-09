"use client";

import type { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { clientFetchApi } from "@/lib/facade/clientFetchApi";
import { ClientBaseService } from "@/lib/services/client-base.service";
import type { CreateMediaSchemaType } from "./schemas/media-shemas";

/** Exactly what `CreateMediaRequest` accepts on the wire, file included. */
export type CreateMediaBody = CreateMediaSchemaType & { file?: File };

/**
 * Browser-side twin of `media.service.ts`, covering only the endpoints the atelier calls
 * directly from the page. The upload no longer transits the Next server, which had to buffer
 * the whole file twice — once to parse the multipart body, once to re-encode it for the API.
 *
 * No hand-rolled FormData here: `HttpClient.parseBody` already converts a body containing a
 * `File` into `FormData`, appending each value under its own property name (so `file` stays
 * `file`), skipping `undefined`/`null` and stringifying the rest.
 */
class MediaClientService extends ClientBaseService {
  constructor() {
    super(clientFetchApi(), "media");
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
