import { EnumType, TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";
export type UserSchema = {
  id: number;
  public_id: string;
  name?: string | null;
  surname?: string | null;
  username: string;
  password: string;
  stripe_customer_id?: string | null;
  profession?: string | null;
  biography?: string | null;
  email: string;
  phone_number?: string | null;
  facebook_link?: string | null;
  website_link?: string | null;
  instagram_link?: string | null;
  youtube_link?: string | null;
  avatar?: string;
  banner?: string;
  is_featured: boolean;
  email_validated?: boolean;
  is_active?: boolean;
  banned?: boolean;
  banned_reason?: string | null;
  funnel_step: number;
  short_biography?: string;
  number_email_validations_sent?: number;
  twofa_enabled?: boolean;
  twofa_code?: string;
  twofa_expires_at?: Date;
  twofa_attempts?: number;
  username_reset_count: number;
  password_reset_count: number;
  next_username_reset?: Date;
  next_password_reset?: Date;
  role_id: number;
  benefit_id: number | null;
  invitation_link_id: number | null;
  language: EnumType<'LANGUAGE_CODE'>;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_generated_at?: Date | null;
  created_at: Date;
  updated_at: Date;
};
export type UserSchemaWithoutTimestamps = Omit<UserSchema, 'created_at' | 'updated_at'>;
export type UserCoreSchema = Omit<UserSchema, 'created_at' | 'updated_at' | 'name' | 'surname' | 'biography' | 'avatar' | 'banner' | 'seo_title' | 'seo_description' | 'seo_generated_at' | 'phone_number' | 'facebook_link' | 'website_link' | 'instagram_link' | 'youtube_link'>;
const tablesUser = [TABLES_ENUM.USERS] as const;
export type UserSchemaColumns = TableColumn<typeof tablesUser, UserSchemaWithoutTimestamps>;
export type UserCoreSchemaColumns = TableColumn<typeof tablesUser, UserCoreSchema>;

// ==================== CORE USER + ROLE JOIN ====================
/** users INNER JOIN roles — prefix colliding role columns (id, name). */
export type UserCoreRoleRow = UserCoreSchema & {
  r_id: number;
  r_name: EnumType<'USER_ROLE'>;
};

// ==================== FULL USER + ROLE JOIN ====================
export type UserFullRoleRow = UserSchema & {
  r_id: number;
  r_name: EnumType<'USER_ROLE'>;
};

/** Select list for users + roles join; r_* aliases avoid id/name collisions with users. */
export type UserCoreSelectColumn =
  | UserCoreSchemaColumns
  | 'roles.id as r_id'
  | 'roles.name as r_name';

export type UserFullSelectColumn =
  | UserSchemaColumns
  | 'roles.id as r_id'
  | 'roles.name as r_name';

// ==================== FULL USER + ROLE + BENEFIT JOIN ====================
// Joins: users + roles + user_benefits + benefits
// Collisions: benefits.id → b_id, benefits.name → b_name, user_benefits.id → ub_id
export type UserFullBenefitRow = UserFullRoleRow & {
  b_id: number | null;
  b_name: string | null;
  type: EnumType<'BENEFIT_TYPE'> | null;
  trial_days: number | null;
  stripe_coupon_id: string | null;
  active: boolean | null;
  ub_id: number | null;
  redeemed: boolean | null;
};

export type UserFullBenefitSelectColumn =
  | UserFullSelectColumn
  | 'benefits.id as b_id'
  | 'benefits.name as b_name'
  | 'benefits.type'
  | 'benefits.trial_days'
  | 'benefits.stripe_coupon_id'
  | 'benefits.active'
  | 'user_benefits.id as ub_id'
  | 'user_benefits.redeemed';

// ==================== USER PROFILE JOIN SCHEMA ====================
// Joins: users + addresses + user_categories + categories
// Collisions are resolved by alias prefixes:
// - Address: a_
// - UserCategories pivot: uc_
// - Category: c_
export type UserProfileRow = {
  // From users (all UserSchemaWithoutTimestamps keys needed for TableColumn compat)
  id: number;
  public_id: string;
  email: string;
  username: string;
  is_active?: boolean;
  banned?: boolean;
  banned_reason?: string | null;
  short_biography?: string | null;
  avatar?: string;
  banner?: string;
  name?: string | null;
  surname?: string | null;
  biography?: string | null;
  profession?: string | null;
  is_featured?: boolean;
  phone_number?: string | null;
  facebook_link?: string | null;
  website_link?: string | null;
  instagram_link?: string | null;
  youtube_link?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_generated_at?: Date | null;

  // From address
  a_id: number;
  formated_address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  user_id?: number | null;

  // From user_categories (aliased: uc_)
  uc_id?: number | null;
  uc_user_id?: number | null;
  category_id?: number | null;

  // From categories (aliased: c_)
  c_id?: number | null;
  c_name?: string | null;
  /** Translation name for request language when present */
  c_tr_name?: string | null;
  c_slug?: string | null;
  tags?: string | null;
  parent_id?: number | null;
  c_is_active?: boolean | null;
  c_type?: EnumType<'CATEGORY_TYPE'> | null;
};

const tablesUserProfile = [
  TABLES_ENUM.USERS,
  TABLES_ENUM.ADDRESSES,
  TABLES_ENUM.USER_CATEGORIES,
  TABLES_ENUM.CATEGORIES,
  TABLES_ENUM.CATEGORY_TRANSLATIONS,
] as const;

export type UserProfileSelectColumn = TableColumn<typeof tablesUserProfile, UserProfileRow>;

// ==================== ARTIST SEARCH SCHEMA ====================
// Joins: users + addresses (1:1, no row multiplication)
// Collisions resolved by alias prefix: a_ for address id
export type ArtistSearchRow = {
  id: number;
  username: string;
  name?: string | null;
  surname?: string | null;
  avatar?: string;
  profession?: string | null;
  short_biography?: string | null;
  is_featured?: boolean;
  a_id?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

const tablesArtistSearch = [
  TABLES_ENUM.USERS,
  TABLES_ENUM.ADDRESSES,
] as const;

export type ArtistSearchSelectColumn = TableColumn<typeof tablesArtistSearch, ArtistSearchRow>;

