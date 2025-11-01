import { UserSessionSchema } from '@repo/common-lib/schemas/user-session';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';

export type BaseUserSession = Omit<
  UserSessionSchema,
  'created_at' | 'updated_at'
>;
export type UserSession = BaseUserSession & {
  user_auth_device: UserAuthDevice;
};
