import { EnumType } from "../constants/enums";
import { UserSchema, BaseUserSchema } from "../schemas/user";
import { FullPlan } from "./plan";
import { UserExtraData } from "./user-extra-data";

// BaseUser derived from BaseUserSchema (without password, timestamps, and extended profile fields)
// Making certain fields required that were optional in the schema
export type BaseUser = Omit<BaseUserSchema, 'password' | 'twofa_code' | 'biography' | 'short_biography' | 'avatar' | 'banner'>;

// BaseUserWithSecrets includes the password field
export type BaseUserWithSecrets = BaseUser & {
  password: string;
  twofa_code?: string;
};

// CompactUser: minimal user info (id, email, username)
export type CompactUser = Pick<UserSchema, 'id' | 'email' | 'username'>;

// User extends the schema with all fields except timestamps, password, and address_id
export type User = Omit<UserSchema, 'created_at' | 'updated_at' | 'password' | 'address_id'>;
export type FindUserRequest = {
  format?: EnumType<'FORMAT_TYPE'>
}

  export type CreateUserInput = Omit<UserSchema, 'id' | 'created_at' | 'updated_at' >;
export type UpdateUserInput = Partial<CreateUserInput> ;
export type UpdateUserInputWithAssets= Omit<UpdateUserInput,'avatar' | 'banner'> & {
  categories?:(string|number)[]
  avatar?:File,
  banner?:File
}


export  type UserMetrics = {
  extra_data: UserExtraData,
  active_plan:FullPlan
}
