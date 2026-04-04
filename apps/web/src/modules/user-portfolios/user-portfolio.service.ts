import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { FullPortfolio, Portfolio } from "@repo/common-lib/types/portfolio";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

class UserPortfolioService extends BaseService {
    constructor() {
        super(fetchApi(), 'users');
    }

    async getById(userId: number, slug: string): Promise<ApiResponse<FullPortfolio | null>> {
        return await this.fetchApi.get({
            resource: `/${userId}/portfolio/${slug}`
        });
    }

    async getByUsername(username: string, slug: string): Promise<ApiResponse<FullPortfolio | null>> {
        return await this.fetchApi.get({
            resource: `/${username}/portfolios/${slug}`
        });
    }

    async getAllByUsername(
        username: string,
        filters?: { is_highlight?: boolean },
    ): Promise<ApiResponse<Portfolio[]>> {
        return await this.fetchApi.get({
            resource: queryParamBuilder(`/${username}/portfolios`, filters),
        });
    }

    async slugExists(username: string, slug: string): Promise<ApiResponse<{ exists: boolean }>> {
        return await this.fetchApi.get({
            resource: `/${username}/portfolio/slug-exist/${slug}`
        });
    }
}

export default new UserPortfolioService();
