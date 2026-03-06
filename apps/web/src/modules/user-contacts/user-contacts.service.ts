import { BaseService } from "@/lib/services/base.service";
import { fetchApi } from "@/lib/facade/fetchApi";
import { UserContact, CreateUserContactInput, UpdateUserContactInput } from "@repo/common-lib/types/user-contact";
import { ApiResponse } from "@repo/common-lib/types/response";

export class UserContactsService extends BaseService {
    constructor() {
        super(fetchApi(), 'user-contacts');
    }

    async create(data: CreateUserContactInput): Promise<ApiResponse<UserContact>> {
        return await this.fetchApi.post({
            resource: '',
            body: data
        });
    }

    async update(id: number, data: UpdateUserContactInput): Promise<ApiResponse<UserContact>> {
        return await this.fetchApi.patch({
            resource: id + '',
            body: data
        });
    }

    async getAll(): Promise<ApiResponse<UserContact[]>> {
        return await this.fetchApi.get({
            resource: '',
            cacheOptions: {
                cache: 'no-store'
            }
        });
    }

    async getOne(id: number): Promise<ApiResponse<UserContact>> {
        return await this.fetchApi.get({
            resource: id + ''
        });
    }
}

let UserContactsServiceInstance: UserContactsService | null = null;

export default (() => {
    if (!UserContactsServiceInstance) {
        UserContactsServiceInstance = new UserContactsService();
    }
    return UserContactsServiceInstance;
})()
