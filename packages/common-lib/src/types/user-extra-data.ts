import { UserExtraDataSchema } from "../schemas/user-extra-data";

// UserExtraData without timestamps
export type UserExtraData = Omit<UserExtraDataSchema, 'created_at' | 'updated_at'>;



export type UpdateOrCreateUserExtraDataInput = Partial< Omit<
UserExtraDataSchema,
'id'
>>;
