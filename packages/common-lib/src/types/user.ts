import { AddressSchema } from "../schemas/address";
import { UserExtraDataSchema, UserSchema, BaseUserSchema } from "../schemas/user";

// BaseUser derived from BaseUserSchema (without password, timestamps, and extended profile fields)
// Making certain fields required that were optional in the schema
export type BaseUser = Omit<BaseUserSchema, 'password'|'twofa_code'>;

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

export type CreateUserExtraDataInput = Omit<
  UserExtraDataSchema,
  'id' | 'created_at' | 'updated_at' | 'media_size' | 'media_count' | 'projects_count' | 'clients_count' | 'services_count' | 'storage_requests_count' | 'last_storage_request_date'
>;
export type UpdateUserExtraDataInput = Partial<CreateUserExtraDataInput>;