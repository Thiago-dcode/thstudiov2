import { BaseUser } from "@repo/common-lib/types/user";

export type TwoFaUser = BaseUser & {
    is_new?:boolean
}
export type LoginRequest = {    
    email: string;
    password: string;
}
export type UserRegisterRequest = LoginRequest & {
    username:string
    invitation_code?: string;
  }
export type Verify2faRequest = {
    email: string;
    twofa_code: string;
}
export type RefreshTokenRequest = {
    user_id: number;
    token: string;
}
export type PasswordRecoveryRequest = {
    email: string;
    fallback_url: string;
}
export type CheckPasswordRecoveryRequest = {
    email: string;
    code: string;
}
export type UpdatePasswordRequest = {
    code: string;
    password: string;
}
export type ValidatePasswordRecoveryAttemptRequest = {
    code: string;
}
export type PasswordRecoveryAttempt = {
    id: number;
    code: string;
    fallback_url: string;
    code_validated: boolean;
    user: {
        email: string;
        username: string;
        id: number;
    };
    expires_at: string;
    created_at: string;
    updated_at: string;
}
export type PasswordRecoveryAttemptWithUser = PasswordRecoveryAttempt & {
    user: BaseUser;
}


export type  UserAuth = BaseUser & {
    need_twofa?:false,
    token:string
};
export type LoginReturn2fa = BaseUser & {
    need_twofa:true,
    token: null;
}
export type LoginReturn = UserAuth | LoginReturn2fa;

