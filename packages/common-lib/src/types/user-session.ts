import { UserAuthDeviceSchema, UserAuthDeviceSchemaWithoutTimestamps, UserSessionSchema } from "../schemas/user-session";

export type UserAuthDevice = Omit<UserAuthDeviceSchema, 'created_at' | 'updated_at'>;
export type CreateUserSessionInput = Omit<
  UserSessionSchema,
  'id' | 'created_at' | 'updated_at'
>;



export type UpdateUserSessionInput = Partial<CreateUserSessionInput>;
export type CreateUserAuthDeviceInput = Omit<
  UserAuthDeviceSchemaWithoutTimestamps,
  'id'
>;
export type UpdateUserAuthDeviceInput = Partial<CreateUserAuthDeviceInput>;