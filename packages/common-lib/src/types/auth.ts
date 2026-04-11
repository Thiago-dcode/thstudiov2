import { PasswordRecoveryAttemptSchema } from "../schemas/password-recovery-attempt";
import { UserAuthDeviceSchema } from "../schemas/user-session";
import { BaseUser } from "./user";

export type  UserAuth = BaseUser & {
    need_twofa?:false,
    token:string
  };
  export type UserTwofa = BaseUser & {
    need_twofa:true,
    token: null;
  }
  export type UserPayload = BaseUser & {
    user_auth_device_id: number;
  };
  
  export type TwoFactorAuth = {
    user_auth_device: UserAuthDeviceSchema;
    user: BaseUser;
    need_2fa: boolean;
  };
  export type PasswordRecoveryAttempt = PasswordRecoveryAttemptSchema;