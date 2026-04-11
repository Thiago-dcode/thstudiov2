import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { fetchApi } from "@/lib/facade/fetchApi";
import { AboutPage } from "@repo/common-lib/types/about-page";

class UserAboutPageService extends BaseService {
    constructor() {
        super(fetchApi(), 'users');
    }

    async getByUsername(username: string): Promise<ApiResponse<AboutPage | null>> {
        return await this.fetchApi.get({
            resource: `/${username}/about-page`
        });
    }
}

export default new UserAboutPageService();
