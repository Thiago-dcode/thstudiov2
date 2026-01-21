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
  funnel_step: number;
  short_biography?: string;
  number_email_validations_sent?: number;
  address_id?: number | null;
  twofa_enabled?: boolean;
  twofa_code?: string;
  twofa_expires_at?: Date;
  twofa_attempts?: number;
  created_at: Date;
  updated_at: Date;
};
export type UserSchemaWithoutTimestamps = Omit<UserSchema, 'created_at' | 'updated_at'>;
export type BaseUserSchema = Omit<UserSchema, 'created_at' | 'updated_at'  | 'name'| 'surname'| 'biography' | 'address_id'|'avatar' |'banner'>;
const tablesUser = [TABLES_ENUM.USERS] as const;
export type UserSchemaColumns = TableColumn<typeof tablesUser, UserSchemaWithoutTimestamps>;
export type BaseUserSchemaColumns = TableColumn<typeof tablesUser, BaseUserSchema>;
export type UserSchemaWithAddress = UserSchema & {
  // From addresses (only colliding columns prefixed)
  addr_id: number;
  addr_created_at: Date;
  addr_updated_at: Date;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
};
const tablesUserWithAddress = [TABLES_ENUM.USERS, TABLES_ENUM.ADDRESSES] as const;
export type UserSchemaWithAddressColumns = TableColumn<typeof tablesUserWithAddress, UserSchemaWithAddress>;

