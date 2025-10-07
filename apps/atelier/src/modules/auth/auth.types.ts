import { BaseUser } from "../users/schemas/users.types";

export type LoginRequest = {    
    email: string;
    password: string;
    user_agent?: string;
    ip_address?: string;
}
export type Verify2faRequest = {
    email: string;
    twofa_code: string;
    user_agent?: string;
    ip_address?: string;
}

export type  UserAuth = Omit<BaseUser ,'token'> & {
    token:string
};

export type LoginReturn = UserAuth | BaseUser;