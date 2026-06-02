import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type { EmailPreference } from "@repo/common-lib/types/email-preferences";
import type { CreateOrUpdateEmailPreferenceSchemaType } from "./schemas/email-preferences.schema";

class EmailPreferencesService extends BaseService {
  constructor() {
    super(fetchApi(), 'email-preferences');
  }

  async getByToken(token: string): Promise<ApiResponse<EmailPreference>> {
    return await this.fetchApi.get({
      resource: `${encodeURIComponent(token)}/token`,
    });
  }

  async createOrUpdate(body: CreateOrUpdateEmailPreferenceSchemaType): Promise<ApiResponse<EmailPreference>> {
    return await this.fetchApi.post({
      resource: '',
      body,
    });
  }
}

let EmailPreferencesServiceInstance: EmailPreferencesService | null = null;

export default (() => {
  if (!EmailPreferencesServiceInstance) {
    EmailPreferencesServiceInstance = new EmailPreferencesService();
  }
  return EmailPreferencesServiceInstance;
})();
