import type { InvitationLink } from "@repo/common-lib/types/invitation-link";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class InvitationLinkService extends BaseService {
  constructor() {
    super(fetchApi(), "invitation-links");
  }

  async findByCode(code: string): Promise<ApiResponse<InvitationLink>> {
    return await this.fetchApi.get({
      resource: `${encodeURIComponent(code)}/code`,
    });
  }

  async validateCode(
    code: string,
  ): Promise<ApiResponse<InvitationLink | null>> {
    return await this.fetchApi.get({
      resource: `${encodeURIComponent(code)}/code/valid`,
    });
  }
}

let InvitationLinkServiceInstance: InvitationLinkService | null = null;

export default (() => {
  if (!InvitationLinkServiceInstance) {
    InvitationLinkServiceInstance = new InvitationLinkService();
  }
  return InvitationLinkServiceInstance;
})();
