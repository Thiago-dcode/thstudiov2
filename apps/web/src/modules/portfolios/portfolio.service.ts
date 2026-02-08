import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { Portfolio, CreatePortfolioInputWithFile, PortfolioIndexRequest } from "@repo/common-lib/types/portfolio";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";

class PortfolioService extends BaseService {
    constructor() {
       super(fetchApi(), 'portfolios');
    }
    async findAll(request?: PortfolioIndexRequest): Promise<ApiResponse<Portfolio[]>> {
        return await this.fetchApi.get({
            resource: request ? queryParamBuilder('', request) : ''
        });
    }
    async getBySlug(userId: number, slug: string): Promise<ApiResponse<Portfolio | null>> {
        return await this.fetchApi.get({
            resource: `/${userId}/${slug}`
        });
    }
    async slugExists(userId: number, slug: string): Promise<ApiResponse<{ exists: boolean }>> {
        return await this.fetchApi.get({
            resource: `/slug-exists/${userId}/${slug}`
        });
    }
    async create(body: CreatePortfolioInputWithFile): Promise<ApiResponse<Portfolio>> {
        return await this.fetchApi.post({body});
    }
}

export default new PortfolioService();

