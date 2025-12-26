import { AddressSchema } from "../schemas/address";
import { UserSchema, BaseUserSchema } from "../schemas/user";
import { BasePlan, FullPlan, PlanWithPrices } from "./plan";
import { UserExtraData } from "./user-extra-data";

// BaseUser derived from BaseUserSchema (without password, timestamps, and extended profile fields)
// Making certain fields required that were optional in the schema
export type BaseUser = Omit<BaseUserSchema, 'password'|'twofa_code' | 'biography'  | 'short_biography' | 'avatar'>;

// BaseUserWithPassword includes the password field
export type BaseUserWithPassword =BaseUserSchema;

// User extends the schema with all fields except timestamps, password, and address_id
// Adds the address object instead of address_id
export type User = Omit<UserSchema, 'created_at' | 'updated_at' | 'password' | 'address_id'> & {
  address?: Omit<AddressSchema, 'created_at' | 'updated_at'>;
};
  export type CreateUserInput = Omit<UserSchema, 'id' | 'created_at' | 'updated_at' >;
export type UpdateUserInput = Partial<CreateUserInput> ;
export type UpdateUserInputAvatarFile = Omit<UpdateUserInput,'avatar'> & {
  categories?:(string|number)[]
  avatar?:File
}


export  type UserMetrics = {
  extra_data: UserExtraData,
  active_plan:FullPlan
}
