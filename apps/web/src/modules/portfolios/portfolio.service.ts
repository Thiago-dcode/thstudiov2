import type { HighlightCount } from "@repo/common-lib/types/general";
import type {
  CreatePortfolioInputWithFile,
  FullPortfolio,
  Portfolio,
  PortfolioIndexRequest,
  UpdatePortfolioInputWithFile,
} from "@repo/common-lib/types/portfolio";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { landingCache } from "@/lib/config";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class PortfolioService extends BaseService {
  constructor() {
    super(fetchApi(), "portfolios");
  }
  async findAll(
    request?: PortfolioIndexRequest,
  ): Promise<ApiResponse<Portfolio[]>> {
    return await this.fetchApi.get({
      resource: request ? queryParamBuilder("", request) : "",
    });
  }
  async getHighlightCount(): Promise<ApiResponse<HighlightCount>> {
    return await this.fetchApi.get({ resource: "/highlight-count" });
  }
  /** Public, admin-curated, and rendered on every landing page view — cached rather than re-fetched. */
  async getFeatured(): Promise<ApiResponse<FullPortfolio | null>> {
    return await this.fetchApi.get({
      resource: "/featured",
      isPublic: true,
      cacheOptions: landingCache("portfolio-featured"),
    });
  }
  async create(
    body: CreatePortfolioInputWithFile,
  ): Promise<ApiResponse<Portfolio>> {
    return await this.fetchApi.post({ body });
  }
  async update(
    id: number,
    body: UpdatePortfolioInputWithFile,
  ): Promise<ApiResponse<Portfolio>> {
    return await this.fetchApi.patch({
      resource: `/${id}`,
      body,
    });
  }
  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetchApi.delete({ resource: `/${id}` });
  }
}

export default new PortfolioService();
