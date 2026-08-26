import type { ApiResponse } from "@repo/common-lib/types/response";
import type {
  CreateUserContactInput,
  UpdateUserContactInput,
  UserContact,
  UserContactIndexRequest,
} from "@repo/common-lib/types/user-contact";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

export class UserContactsService extends BaseService {
  constructor() {
    super(fetchApi(), "users");
  }

  async create(
    data: CreateUserContactInput,
  ): Promise<ApiResponse<UserContact>> {
    return await this.fetchApi.post({
      resource: `${data.user_id}/contacts`,
      body: data,
    });
  }

  async update(
    id: number,
    user_id: number,
    data: UpdateUserContactInput,
  ): Promise<ApiResponse<UserContact>> {
    return await this.fetchApi.patch({
      resource: `${user_id}/contacts/${id}`,
      body: data,
    });
  }

  async getAll(
    user_id: number,
    filters?: UserContactIndexRequest,
  ): Promise<ApiResponse<UserContact[]>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder(`${user_id}/contacts`, filters),
      cacheOptions: {
        cache: "no-store",
      },
    });
  }

  async getOne(id: number, user_id: number): Promise<ApiResponse<UserContact>> {
    return await this.fetchApi.get({
      resource: `${user_id}/contacts/${id}`,
    });
  }
}

let UserContactsServiceInstance: UserContactsService | null = null;

export default (() => {
  if (!UserContactsServiceInstance) {
    UserContactsServiceInstance = new UserContactsService();
  }
  return UserContactsServiceInstance;
})();
