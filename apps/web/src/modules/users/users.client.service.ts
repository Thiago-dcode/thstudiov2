"use client";

import type { CreateMediaUploadUrl } from "@repo/common-lib/types/media";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type { CreateUserImageUploadUrlInput } from "@repo/common-lib/types/user";
import { clientFetchApi } from "@/lib/facade/clientFetchApi";
import { ClientBaseService } from "@/lib/services/client-base.service";

/**
 * Browser-side twin of `users.service.ts`, covering only what must run from the page: the
 * presigned URL an avatar or banner is PUT to before `updateUserAction` claims it.
 */
class UsersClientService extends ClientBaseService {
  constructor() {
    super(clientFetchApi(), "users");
  }

  async createImageUploadUrl(
    id: number,
    body: CreateUserImageUploadUrlInput,
  ): Promise<ApiResponse<CreateMediaUploadUrl>> {
    return await this.send(() =>
      this.fetchApi.post({ resource: `/${id}/upload-url`, body }),
    );
  }
}

export default new UsersClientService();
