import type { EntitySeoMetadata } from "@repo/common-lib/types/ai";
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

  /**
   * The owner's editor read: unlike the artist page it includes media the owner switched off.
   * Saving replaces the portfolio's whole media list, so the editor must load all of it.
   */
  async getForOwner(
    userId: number,
    slug: string,
  ): Promise<ApiResponse<FullPortfolio | null>> {
    return await this.fetchApi.get({
      resource: `/${userId}/portfolios/${slug}/edit`,
      cacheOptions: { cache: "no-cache" },
    });
  }

  /** Lean, locale-resolved SEO for generateMetadata. `lang` (EN/ES/PT) forces the API locale. */
  async getSeoMetadata(
    username: string,
    slug: string,
    lang: string,
  ): Promise<ApiResponse<EntitySeoMetadata | null>> {
    return await this.fetchApi.get({
      resource: `/${username}/portfolios/${slug}/metadata?lan=${lang}`,
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
}

export default new UserPortfolioService();
