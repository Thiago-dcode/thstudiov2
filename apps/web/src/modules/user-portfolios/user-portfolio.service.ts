import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { FullPortfolio } from "@repo/common-lib/types/portfolio";

class UserPortfolioService extends BaseService {
    constructor() {
        super(fetchApi(), 'users/portfolios');
    }

    async getById(userId: number, slug: string): Promise<ApiResponse<FullPortfolio | null>> {
        return await this.fetchApi.get({
            resource: `/get-by-id/${userId}/${slug}`
        });
    }

    async getByUsername(username: string, slug: string): Promise<ApiResponse<FullPortfolio | null>> {
        return await this.fetchApi.get({
            resource: `/get-by-username/${username}/${slug}`
        });
    }

    async slugExists(userId: number, slug: string): Promise<ApiResponse<{ exists: boolean }>> {
        return await this.fetchApi.get({
            resource: `/slug-exists/${userId}/${slug}`
        });
    }
}

export default new UserPortfolioService();
