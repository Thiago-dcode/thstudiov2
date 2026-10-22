import { UserSchema, UserCoreSchema } from "../schemas/user";
import { CategoryBase } from "./category";
import { Role } from "./role";
import { FullPlan } from "./plan";
import { OffsetPaginationRequest } from "./request";
import { UserExtraData } from "./user-extra-data";
import { ProfileStatus } from "./profile-status";
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
  twofa_attempts?: number;
};

// CompactUser: minimal user info (id, email, username)
export type CompactUser = Pick<UserSchema, 'id' | 'email' | 'username' | 'name' | 'surname'| 'benefit_id' | 'language'>;
// What anonymous visitors may see of an artist in compact form. `CompactUser` carries the
// account email for internal callers (mail relays, notifications) and must never be public.
export type PublicCompactUser = Pick<UserSchema, 'id' | 'username' | 'name' | 'surname'>;

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
  country?: string | null;
  /** ISO 3166-1 alpha-2 — `PostalAddress.addressCountry` in the artist's structured data. */
  country_code?: string | null;
};

// Public-facing profile: excludes email/banned/banned_reason, never meant to leave the account owner's view.
export type UserProfile = Pick<UserSchema,
  | 'id' | 'name' | 'surname' | 'username'
  | 'avatar' | 'banner'
  | 'is_active' | 'short_biography' | 'biography' | 'profession' | 'is_featured'
  | 'phone_number' | 'facebook_link' | 'website_link' | 'instagram_link' | 'youtube_link'
  | 'seo_title' | 'seo_description' | 'seo_generated_at'
> & {
  address: ProfileAddress | null;
  categories: Omit<CategoryBase,'is_featured'>[];
  /**
   * Complete enough to be shared/indexed: a public portfolio plus name, profession and locality
   * (see `isArtistShareReady`). Drives `noindex` + the muted share card on incomplete profiles.
   */
  is_share_ready: boolean;
  /** Last profile edit (ISO) — `ProfilePage.dateModified`. */
  updated_at?: string | null;
};

export type CreateUserInput = Omit<
  UserSchema,
  'id' | 'created_at' | 'updated_at' | 'is_featured' | 'seo_title' | 'seo_description' | 'seo_generated_at'
>;
export type UpdateUserInput = Partial<CreateUserInput>;
export type UpdateUserInputWithAssets = Omit<UpdateUserInput, 'avatar' | 'banner'> & {
  categories?: (string | number)[]
  /** Upload ids from `POST /users/:id/upload-url`; the image itself went straight to S3. */
  avatar_upload_id?: string
  banner_upload_id?: string
  remove_banner?: boolean
}

/** Body for `POST /users/:id/upload-url` (avatar or banner). Answers a `CreateMediaUploadUrl`. */
export type CreateUserImageUploadUrlInput = {
  content_type: string
  size: number
}


export type UpdateUserPasswordInput = {
  old_password: string;
  new_password: string;
};

/** Owner-only account state the atelier reacts to (pending-deletion modal, deactivated label). */
export type UserAccountStatus = Pick<UserSchema, 'is_active' | 'deletion_requested_at'>;

export type UserMetrics = {
  extra_data: UserExtraData,
  active_plan: FullPlan,
  profile_status: ProfileStatus,
  account: UserAccountStatus,
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

/** Payload of the account-deletion queue jobs (hard delete, "deleted in 2 days" warning). */
export type AccountDeletionJobInput = { user_id: number };

/** Body of `POST users/:id/deletion`. */
export type RequestAccountDeletionInput = {
  password: string;
  /** Stop the paid subscription's renewal now instead of on the day of the hard delete. */
  cancel_subscription?: boolean;
};

export type AccountDeletionRequestResult = {
  deletion_requested_at: Date;
  deletion_scheduled_for: Date;
};
