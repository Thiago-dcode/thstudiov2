import type { HighlightCount } from "@repo/common-lib/types/general";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type {
  CreateServicePayload,
  Service,
  ServiceIndexRequest,
  UpdateServicePayload,
} from "@repo/common-lib/types/service";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class ServiceService extends BaseService {
  constructor() {
    super(fetchApi(), "services");
  }
  async findAll(
    request?: ServiceIndexRequest,
  ): Promise<ApiResponse<Service[]>> {
    return await this.fetchApi.get({
      resource: request ? queryParamBuilder("", request) : "",
    });
  }
  async getHighlightCount(): Promise<ApiResponse<HighlightCount>> {
    return await this.fetchApi.get({ resource: "/highlight-count" });
  }
  async create(body: CreateServicePayload): Promise<ApiResponse<Service>> {
    return await this.fetchApi.post({ body });
  }
  async update(
    id: number,
    body: UpdateServicePayload,
  ): Promise<ApiResponse<Service>> {
    return await this.fetchApi.patch({
      resource: `/${id}`,
      body,
    });
  }
  async delete(id: number): Promise<ApiResponse<void>> {
    return await this.fetchApi.delete({ resource: `/${id}` });
  }
}

export default new ServiceService();
