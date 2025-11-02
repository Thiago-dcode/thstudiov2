
import { TABLES_ENUM } from "../constants/database";
import { TableColumn } from "../types/database";
export type UserSchema = {
  id: number;
  name?: string | null;
  surname?: string | null;
  username: string;
  password: string;
  biography?: string | null;
  email: string;
  avatar?:string;
  email_validated?: boolean;
  is_active?: boolean;
  twofa_attempts?: number;
  funnel_step:number,
  short_biography?:string,
  number_email_validations_sent?: number;
  address_id?: number | null;
  twofa_enabled?: boolean;
  twofa_code?: string;
  twofa_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
};
export type UserSchemaWithoutTimestamps = Omit<UserSchema, 'created_at' | 'updated_at'>;
export type BaseUserSchema = Omit<UserSchema, 'created_at' | 'updated_at'  | 'name'| 'surname'| 'biography'|'short_biography' | 'address_id'|'avatar'>;
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

export type UserExtraDataSchema = {
  id: number;
  media_size: number;
  media_count: number;
  projects_count: number;
  clients_count: number;
  services_count: number;
  storage_requests_count: number;
  last_storage_request_date: Date;
  plan_start_date: Date;
  plan_end_date: Date | null;
  plan_autorenewal: boolean;
  user_id: number;
  plan_id: number | null;
  last_plan_transaction_id: number | null;
  created_at: Date;
  updated_at: Date;
};
