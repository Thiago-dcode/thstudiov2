import { BaseService } from "@/lib/services/base.service";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseUser, CompactUser, UpdateUserInputWithAssets, UpdateUserPasswordInput, User, UserMetrics, UserProfile } from "@repo/common-lib/types/user";
import { ApiResponse } from "@repo/common-lib/types/response";
import { CategoryBase } from "@repo/common-lib/types/category";
import { UserExtraData } from "@repo/common-lib/types/user-extra-data";
import { FullPlan } from "@repo/common-lib/types/plan";
import { FullPlanSubscription } from "@repo/common-lib/types/plan-subscription";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { AboutPage } from "@repo/common-lib/types/about-page";
import { Media } from "@repo/common-lib/types/media";
import { Address } from "@repo/common-lib/types/address";

export class UserService extends BaseService {
    constructor() {
        super(fetchApi(), 'users');

    }

    async getOne(id: number): Promise<ApiResponse<User>> {

        return await this.fetchApi.get({
            resource: queryParamBuilder(id + ''),
        });

    }
    async update(id: number, data: UpdateUserInputWithAssets): Promise<ApiResponse<BaseUser>> {

        return await this.fetchApi.patch({
            resource: id + '',
            body: data
        });

    }
    async getAllCategories(id: number): Promise<ApiResponse<CategoryBase[]>> {

        return await this.fetchApi.get({
            resource: `${id}/categories`,
            cacheOptions: {
                cache: 'force-cache',
                next: {
                    tags: [`user-${id}`]
                }
            }
        });
    }

    async getAllMedia(id: number): Promise<ApiResponse<Media[]>> {

        return await this.fetchApi.get({
            resource: `${id}/media`,
            cacheOptions: {
                cache: 'force-cache',
                next: {
                    tags: [`user-${id}`]
                }
            }
        });
    }
    async getAboutPage(username: string): Promise<ApiResponse<AboutPage>> {

        return await this.fetchApi.get({
            resource: `${username}/about-page`
        })
    }
    async getExtraData(id: number): Promise<ApiResponse<UserExtraData>> {

        return await this.fetchApi.get({
            resource: `${id}/extra-data`
        });
    }
    async getActivePlan(id: number): Promise<ApiResponse<FullPlan>> {

        return await this.fetchApi.get({
            resource: `${id}/plan`
        })
    }
    async getActiveSubscription(userId: number): Promise<ApiResponse<FullPlanSubscription>> {

        return await this.fetchApi.get({
            resource: `${userId}/subscription`,
            cacheOptions: {
                cache: 'force-cache',
                next: {
                    tags: [`subscription-${userId}`]
                }
            }

        })
    }
    async metrics(id: number): Promise<ApiResponse<UserMetrics>> {

        return await this.fetchApi.get({
            resource: `${id}/metrics`,
            cacheOptions: {
                cache: 'default',
                next: {
                    tags: [`subscription-${id}`, `user-${id}`]
                }
            }
        })
    }
    async updatePassword(id: number, data: UpdateUserPasswordInput): Promise<ApiResponse<BaseUser>> {
        return await this.fetchApi.post({
            resource: `${id}/password`,
            body: data,
        });
    }

    async getProfile(username: string): Promise<ApiResponse<UserProfile>> {
        return await this.fetchApi.get({
            resource: `profile/${username}`,
        });
    }
    async getCompact(username: string): Promise<ApiResponse<CompactUser>> {
        return await this.fetchApi.get({
            resource: `compact/${username}`,
        });
    }

    async address(id: number): Promise<ApiResponse<Address>> {

        return await this.fetchApi.get({
            resource: `${id}/address`,
            cacheOptions: {
                cache: 'default',
                next: {
                    tags: [`address-${id}`]
                }
            }
        })
    }

}

let UserServiceInstance: UserService | null = null;

export default (() => {
    if (!UserServiceInstance) {
        UserServiceInstance = new UserService();
    }
    return UserServiceInstance;
})()
