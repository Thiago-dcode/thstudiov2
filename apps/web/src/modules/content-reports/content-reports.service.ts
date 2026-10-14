import type {
  ContentReport,
  CreateContentReportInput,
} from "@repo/common-lib/types/content-report";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

export class ContentReportsService extends BaseService {
  constructor() {
    super(fetchApi(), "content-reports");
  }

  /** Public DSA notice; the API answers with the reference only. */
  async create(
    data: CreateContentReportInput,
  ): Promise<ApiResponse<Pick<ContentReport, "id" | "created_at">>> {
    return await this.fetchApi.post({ resource: "", body: data });
  }
}

let instance: ContentReportsService | null = null;

const contentReportsService = (() => {
  if (!instance) instance = new ContentReportsService();
  return instance;
})();

export default contentReportsService;
