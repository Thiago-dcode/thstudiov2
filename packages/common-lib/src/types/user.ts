import { UserSchema, UserCoreSchema } from "../schemas/user";
import { CategoryBase } from "./category";
import { Role } from "./role";
import { FullPlan } from "./plan";
import { OffsetPaginationRequest } from "./request";
import { UserExtraData } from "./user-extra-data";
import { Benefit } from "./benefit";

// Core user fields (no password/secrets, no profile display fields, no flat FK role_id).
// Always includes nested `role` from users ↔ roles join (see UserCoreRoleRow).
export type BaseUser = Omit<
  UserCoreSchema,
  | 'password'
  | 'twofa_code'
  | 'short_biography'
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
export type CompactUser = Pick<UserSchema, 'id' | 'email' | 'username' | 'name' | 'surname'| 'benefit_id' | 'language'>;

// Full user with all profile fields, nested role + benefit (no raw FKs, no secrets).
export type User = Omit<
  UserSchema,
  'created_at' | 'updated_at' | 'password' | 'role_id' | 'benefit_id' | 'invitation_link_id'
> & {
  role: Pick<Role, 'id' | 'name'>;
  benefit: Benefit & {
    redeemed:boolean,
  } | null;
  // invitation_link: InvitationLink | null;
};

export type ProfileAddress = {
  formated_address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
};

// Public-facing profile: excludes email/banned/banned_reason, never meant to leave the account owner's view.
export type UserProfile = Pick<UserSchema,
  | 'id' | 'name' | 'surname' | 'username'
  | 'avatar' | 'banner'
  | 'is_active' | 'short_biography' | 'biography' | 'profession' | 'is_featured'
> & {
  address: ProfileAddress | null;
  categories: Omit<CategoryBase,'is_featured'>[];
};

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
