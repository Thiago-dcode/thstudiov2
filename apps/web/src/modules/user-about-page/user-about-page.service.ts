import type { AboutPage } from "@repo/common-lib/types/about-page";
import type { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

class UserAboutPageService extends BaseService {
 constructor() {
 super(fetchApi(), "users");
 }

 async getByUsername(
 username: string,
 ): Promise<ApiResponse<AboutPage | null>> {
 return await this.fetchApi.get({
 resource: `/${username}/about-page`,
 });
 }
}

export default new UserAboutPageService();
