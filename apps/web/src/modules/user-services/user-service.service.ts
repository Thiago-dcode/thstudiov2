import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { FullService, Service, ServiceIndexRequest } from "@repo/common-lib/types/service";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

class UserServiceService extends BaseService {
    constructor() {
        super(fetchApi(), 'users');
    }

    async getById(userId: number, slug: string): Promise<ApiResponse<FullService | null>> {
        return await this.fetchApi.get({
            resource: `/${userId}/service/${slug}`
        });
    }

    async getByUsername(username: string, slug: string): Promise<ApiResponse<FullService | null>> {
        return await this.fetchApi.get({
            resource: `/${username}/services/${slug}`
        });
    }

    async getAllByUsername(
        username: string,
        filters?: Omit<ServiceIndexRequest, 'user_id'>,
    ): Promise<ApiResponse<Service[]>> {
        return await this.fetchApi.get({
            resource: queryParamBuilder(`/${username}/services`, filters),
        });
    }

    async slugExists(username: string, slug: string): Promise<ApiResponse<{ exists: boolean }>> {
        return await this.fetchApi.get({
            resource: `/${username}/service/slug-exist/${slug}`
        });
    }
}

export default new UserServiceService();
