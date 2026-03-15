import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { FullService, Service } from "@repo/common-lib/types/service";

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

    async getAllByUsername(username: string): Promise<ApiResponse<Service[]>> {
        return await this.fetchApi.get({
            resource: `/${username}/services`
        });
    }

    async slugExists(username: string, slug: string): Promise<ApiResponse<{ exists: boolean }>> {
        return await this.fetchApi.get({
            resource: `/${username}/service/slug-exist/${slug}`
        });
    }
}

export default new UserServiceService();
