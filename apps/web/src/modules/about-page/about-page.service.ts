import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";
import { AboutPage, CreateAboutPageInputWithFile, UpdateAboutPageInputWithFile } from "@repo/common-lib/types/about-page";
import { ApiResponse } from "@repo/common-lib/types/response";

 class AboutPageService extends BaseService {
    constructor() {
       super(fetchApi(), 'about-page');
    }

    async create(data:CreateAboutPageInputWithFile):Promise<ApiResponse<AboutPage>>{

        return await this.fetchApi.post({
            resource:'',
            body:data,
        })


    }
    async update(id:number,data:UpdateAboutPageInputWithFile):Promise<ApiResponse<AboutPage>>{

        return await this.fetchApi.patch({
            resource:id +'',
            body:data,
        })


    }
}

let AboutPageServiceInstance: AboutPageService | null = null;

export default (() => {
    if (!AboutPageServiceInstance) {
        AboutPageServiceInstance = new AboutPageService();
    }
    return AboutPageServiceInstance;
})();