import { UserSessionSchema } from '@repo/common-lib/schemas/user-session';
import { UserAuthDevice } from '@repo/common-lib/types/user-session';

export type BaseUserSession = Omit<
  UserSessionSchema,
  'created_at' | 'updated_at'
>;
export type UserSession = BaseUserSession & {
  user_auth_device: UserAuthDevice;
};
