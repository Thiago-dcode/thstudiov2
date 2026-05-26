import { BaseService } from "@/lib/services/base.service";
import { ApiResponse } from "@repo/common-lib/types/response";
import { CheckPasswordRecoveryRequest, LoginRequest, LoginReturn, PasswordRecoveryAttempt, PasswordRecoveryRequest, UpdatePasswordRequest, UserAuth, UserRegisterRequest, ValidatePasswordRecoveryAttemptRequest, Verify2faRequest } from "./auth.types";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseUser, User } from "@repo/common-lib/types/user";

export class AuthService extends BaseService {
    constructor() {
       super(fetchApi(), 'auth');

    }
    async register(registerRequest: UserRegisterRequest): Promise<ApiResponse<BaseUser>> {

        return await this.fetchApi.post({
            resource: 'register',
            body: registerRequest,
        });
       
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
    async passwordRecovery(passwordRecoveryRequest: PasswordRecoveryRequest): Promise<ApiResponse<PasswordRecoveryAttempt>> {
        return await this.fetchApi.post({
            resource: 'password-recovery',
            body: passwordRecoveryRequest,
        });
    }
    async checkPasswordRecovery(checkPasswordRecoveryRequest: CheckPasswordRecoveryRequest): Promise<ApiResponse<PasswordRecoveryAttempt>> {
        return await this.fetchApi.post({
            resource: 'check-password-recovery-attempt',
            body: checkPasswordRecoveryRequest,
        });
    }
    async updatePassword(updatePasswordRequest: UpdatePasswordRequest): Promise<ApiResponse<User>> {
        return await this.fetchApi.post({
            resource: 'update-password',
            body: updatePasswordRequest,
        });
    }
    async validatePasswordRecoveryAttempt(validatePasswordRecoveryAttemptRequest: ValidatePasswordRecoveryAttemptRequest): Promise<ApiResponse<PasswordRecoveryAttempt>> {
        return await this.fetchApi.post({
            resource: 'validate-password-recovery-attempt',
            body: validatePasswordRecoveryAttemptRequest,
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
