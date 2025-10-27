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
    token:string
};
export type LoginReturn2fa = BaseUser & {
    token: null;
}
export type LoginReturn = UserAuth | LoginReturn2fa;

export type LoginActionReturnError = {
    errors:string[],
    data:null,
}
export type LoginActionReturnSuccess<T> = {
    data:T,
    errors:null,
}
export type AuthActionReturn< K,T =LoginReturn> = (LoginActionReturnError | LoginActionReturnSuccess<T>) & {
    inputs: K| undefined
};