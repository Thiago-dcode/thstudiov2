import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { Portfolio, CreatePortfolioInputWithFile, UpdatePortfolioInputWithFile, PortfolioIndexRequest } from "@repo/common-lib/types/portfolio";
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
    async create(body: CreatePortfolioInputWithFile): Promise<ApiResponse<Portfolio>> {
        return await this.fetchApi.post({body});
    }
    async update(id: number, body: UpdatePortfolioInputWithFile): Promise<ApiResponse<Portfolio>> {
        return await this.fetchApi.patch({
            resource: `/${id}`,
            body
        });
    }
    async delete(id: number): Promise<ApiResponse<void>> {
        return await this.fetchApi.delete({ resource: `/${id}` });
    }
}

export default new PortfolioService();

