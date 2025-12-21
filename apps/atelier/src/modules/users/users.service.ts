import { BaseService } from "@/lib/services/base.service";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseUser, UpdateUserInputAvatarFile, User } from "@repo/common-lib/types/user";
import { ApiResponse } from "@repo/common-lib/types/response";
import { CategoryBase } from "@repo/common-lib/types/category";

export class UserService extends BaseService {
    constructor() {
        super(fetchApi(), 'users');

    }

    async getOne(id:number): Promise<ApiResponse<User>>{

        return await this.fetchApi.get({
            resource:id +'',
        });

    }
     async update(id:number,data:UpdateUserInputAvatarFile): Promise<ApiResponse<BaseUser>>{

        return await this.fetchApi.patch({
            resource:id +'',
            body:data
        });

    }
    async getAllCategories(id:number): Promise<ApiResponse<CategoryBase[]>>{

        return await this.fetchApi.get({
            resource:`${id}/categories`,
        });
    }

}

let UserServiceInstance: UserService | null = null;

export default (() => {
    if(!UserServiceInstance) {
        UserServiceInstance = new UserService();
    }
    return UserServiceInstance;
})()
