import { BaseUser } from '@repo/common-lib/types/user';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';
import { PasswordRecoveryAttemptSchema } from '@repo/database/schemas/password-recovery-attempts';

export type UserAuth =  BaseUser & {
  token: string;
};
export type UserPayload = BaseUser & {
  user_auth_device_id: number;
};

export type TwoFactorAuth = {
  user_auth_device: UserAuthDevice;
  user: BaseUser;
  need_2fa: boolean;
};
export type PasswordRecoveryAttempt = PasswordRecoveryAttemptSchema;