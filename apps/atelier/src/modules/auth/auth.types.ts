import { BaseUser } from "../users/schemas/users.types";

export type LoginRequest = {    
    email: string;
    password: string;
}
export type Verify2faRequest = {
    email: string;
    twofa_code: string;
}
export type RefreshTokenRequest = {
    user_id: number;
    token: string;
}

export type  UserAuth = Omit<BaseUser ,'token'> & {
    token:string
};

export type LoginReturn = UserAuth | BaseUser;