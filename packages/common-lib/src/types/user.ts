import { EnumType } from "../constants/enums";
import { UserSchema, BaseUserSchema } from "../schemas/user";
import { CategoryBase } from "./category";
import { Role } from "./role";
import { FullPlan } from "./plan";
import { OffsetPaginationRequest } from "./request";
import { UserExtraData } from "./user-extra-data";

// BaseUser derived from BaseUserSchema (without password, timestamps, extended profile fields, and flat role_id)
// Always includes nested `role` from users ↔ roles join (see BaseUserWithRoleRowSchema).
export type BaseUser = Omit<
  BaseUserSchema,
  | 'password'
  | 'twofa_code'
  | 'biography'
  | 'short_biography'
  | 'avatar'
  | 'banner'
  | 'role_id'
> & {
  role: Pick<Role, 'id' | 'name'>;
};

// BaseUserWithSecrets includes the password field
export type BaseUserWithSecrets = BaseUser & {
  password: string;
  twofa_code?: string;
};

// CompactUser: minimal user info (id, email, username)
export type CompactUser = Pick<UserSchema, 'id' | 'email' | 'username' | 'name' | 'surname'>;

// User extends the schema with all fields except timestamps, password, address_id, and flat role_id
export type User = Omit<
  UserSchema,
  'created_at' | 'updated_at' | 'password' | 'address_id' | 'role_id'
> & {
  role: Pick<Role, 'id' | 'name'>;
};

export type ProfileAddress = {
  formated_address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
};

export type UserProfile = Pick<UserSchema,
  | 'id' | 'name' | 'surname' | 'username' | 'email'
  | 'avatar' | 'banner' | 'banned' | 'banned_reason'
  | 'is_active' | 'short_biography' | 'biography' | 'profession' | 'is_featured'
> & {
  address: ProfileAddress | null;
  categories: Omit<CategoryBase,'is_featured'>[];
};
export type FindUserRequest = {
  format?: EnumType<'FORMAT_TYPE'>
}

export type CreateUserInput = Omit<UserSchema, 'id' | 'created_at' | 'updated_at' | 'is_featured'>;
export type UpdateUserInput = Partial<CreateUserInput>;
export type UpdateUserInputWithAssets = Omit<UpdateUserInput, 'avatar' | 'banner'> & {
  categories?: (string | number)[]
  avatar?: File,
  banner?: File
}


export type UpdateUserPasswordInput = {
  old_password: string;
  new_password: string;
};

export type UserMetrics = {
  extra_data: UserExtraData,
  active_plan: FullPlan
}

/** Query for listing artists; the API always applies offset pagination (paginated is forced server-side). */
export type ArtistIndexRequest = OffsetPaginationRequest & {
  search?: string;
  is_featured?:boolean;
  //Array of category slugs
  categories?: string[];
  /** Matches `addresses.city` (case-insensitive substring on API). */
  city?: string;
  /** Matches `addresses.state` (case-insensitive substring on API). */
  state?: string;
  /** Matches `addresses.country` (case-insensitive substring on API). */
  country?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

export type ArtistCard = {
  id: number;
  username: string;
  name?: string | null;
  surname?: string | null;
  avatar?: string;
  profession?: string | null;
  short_biography?: string | null;
  address: {
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
  categories: Pick<CategoryBase, 'id' | 'name' | 'slug'>[];
  is_featured?: boolean;
}
