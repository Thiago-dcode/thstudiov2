import { BaseUser } from '@repo/common-lib/types/user';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';
import { PasswordRecoveryAttemptSchema } from '@repo/common-lib/schemas/password-recovery-attempt';


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
  user_auth_device: UserAuthDevice;
  user: BaseUser;
  need_2fa: boolean;
};
export type PasswordRecoveryAttempt = PasswordRecoveryAttemptSchema;