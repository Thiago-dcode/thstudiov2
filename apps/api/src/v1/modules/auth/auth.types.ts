import { BaseUser } from '../users/users.types';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';

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
