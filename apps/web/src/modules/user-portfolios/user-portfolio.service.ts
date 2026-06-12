import type {
  FullPortfolio,
  Portfolio,
  PortfolioIndexRequest,
} from "@repo/common-lib/types/portfolio";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class UserPortfolioService extends BaseService {
  constructor() {
    super(fetchApi(), "users");
  }

  async getByUsername(
    username: string,
    slug: string,
  ): Promise<ApiResponse<FullPortfolio | null>> {
    return await this.fetchApi.get({
      resource: `/${username}/portfolios/${slug}`,
    });
  }

  async getAllByUsername(
    username: string,
    filters?: Omit<PortfolioIndexRequest, "user_id">,
  ): Promise<ApiResponse<Portfolio[]>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder(`/${username}/portfolios`, filters),
    });
  }

  async slugExists(
    username: string,
    slug: string,
  ): Promise<ApiResponse<{ exists: boolean }>> {
    return await this.fetchApi.get({
      resource: `/${username}/portfolios/slug-exist/${slug}`,
    });
  }
}

export default new UserPortfolioService();
