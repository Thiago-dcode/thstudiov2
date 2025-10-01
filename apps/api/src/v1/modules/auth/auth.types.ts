import { BaseUser } from '../users/users.types';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';

export type UserAuth =  Omit<BaseUser, 'twofa_code' | 'twofa_expires_at' | 'email_validated' | 'twofa_enabled'> & {
  token: string;
};
export type UserPayload = Omit<BaseUser, 'twofa_code' | 'twofa_expires_at' | 'email_validated' | 'twofa_enabled'> & {
  user_auth_device_id: number;
};

export type TwoFactorAuth = {
  user_auth_device: UserAuthDevice;
  user: BaseUser;
  need_2fa: boolean;
};
