import { TABLES_ENUM } from "../constants/enums";
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
  avatar?: string;
  banner?: string;
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
  created_at: Date;
  updated_at: Date;
};
export type UserSchemaWithoutTimestamps = Omit<UserSchema, 'created_at' | 'updated_at'>;
export type BaseUserSchema = Omit<UserSchema, 'created_at' | 'updated_at' | 'name' | 'surname' | 'biography' | 'avatar' | 'banner'>;
const tablesUser = [TABLES_ENUM.USERS] as const;
export type UserSchemaColumns = TableColumn<typeof tablesUser, UserSchemaWithoutTimestamps>;
export type BaseUserSchemaColumns = TableColumn<typeof tablesUser, BaseUserSchema>;

// ==================== USER PROFILE JOIN SCHEMA ====================
// Joins: users + addresses + user_categories + categories
// Collisions are resolved by alias prefixes:
// - Address: a_
// - UserCategories pivot: uc_
// - Category: c_
export type UserProfileSchema = {
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

  // From address
  a_id:number;
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
  tags?:string | null;
  parent_id?:number | null;
};

const tablesUserProfile = [
  TABLES_ENUM.USERS,
  TABLES_ENUM.ADDRESSES,
  TABLES_ENUM.USER_CATEGORIES,
  TABLES_ENUM.CATEGORIES,
] as const;

export type UserProfileSchemaColumns = TableColumn<typeof tablesUserProfile, UserProfileSchema>;

// ==================== ARTIST SEARCH SCHEMA ====================
// Joins: users + addresses (1:1, no row multiplication)
// Collisions resolved by alias prefix: a_ for address id
export type ArtistSearchSchema = {
  id: number;
  username: string;
  name?: string | null;
  surname?: string | null;
  avatar?: string;
  profession?: string | null;
  short_biography?: string | null;
  a_id?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

const tablesArtistSearch = [
  TABLES_ENUM.USERS,
  TABLES_ENUM.ADDRESSES,
] as const;

export type ArtistSearchSchemaColumns = TableColumn<typeof tablesArtistSearch, ArtistSearchSchema>;

