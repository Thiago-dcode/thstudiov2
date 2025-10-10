import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { LoginRequest, LoginReturn, UserAuth, Verify2faRequest } from "./auth.types";
import { fetchApi } from "@/lib/facade/fetchApi";

export class AuthService extends BaseService {
    constructor() {
        super(fetchApi, 'auth');

    }

    async login(authLoginRequest: LoginRequest): Promise<ApiResponse<LoginReturn>> {

        return await this.fetchApi.post({
            resource: 'login',
            body: authLoginRequest,
        });
       
    }
    async logout(): Promise<ApiResponse<void>> {
        return await this.fetchApi.post({
            resource: 'logout',
        });
    }
    async verify2fa(verify2faRequest: Verify2faRequest): Promise<ApiResponse<UserAuth>> {
        return await this.fetchApi.post({
            resource: 'verify-2fa',
            body: verify2faRequest,
        });
    }
    async refreshToken(): Promise<ApiResponse<UserAuth>> {
        return await this.fetchApi.post({
            resource: 'refresh-token',
            body: {},
        });
    }
}

let AuthServiceInstance: AuthService | null = null;

export default (() => {
    if(!AuthServiceInstance) {
        AuthServiceInstance = new AuthService();
    }
    return AuthServiceInstance;
})()
