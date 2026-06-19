import type {
 CategoryBase,
 CategoryIndexRequest,
} from "@repo/common-lib/types/category";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class CategoryService extends BaseService {
 constructor() {
 super(fetchApi(), "categories");
 }

 async getAll(
 request?: CategoryIndexRequest,
 ): Promise<ApiResponse<CategoryBase[]>> {
 return await this.fetchApi.get({
 resource: request ? queryParamBuilder("", request) : "",
 });
 }
}

let CategoryServiceInstance: CategoryService | null = null;

export default (() => {
 if (!CategoryServiceInstance) {
 CategoryServiceInstance = new CategoryService();
 }
 return CategoryServiceInstance;
})();
