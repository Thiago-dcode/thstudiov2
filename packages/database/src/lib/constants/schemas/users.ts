import { AddressSchema } from "./addresses";

export type UserSchema = {
  id: number;
  name?: string | null;
  surname?: string | null;
  username: string;
  password: string;
  biography?: string | null;
  email: string;
  email_validated: boolean;
  number_email_validations_sent: number;
  address_id?: number | null;
  created_at: Date;
  updated_at: Date;
};
export type UserSchemaWithAddress = UserSchema & Exclude<AddressSchema,'id'> & {address_id: number};
export type CreateUserInput = Omit<UserSchema, 'id' | 'created_at' | 'updated_at' | 'address_id' | 'email_validated' | 'number_email_validations_sent'>;
export type UpdateUserInput = Partial<CreateUserInput>;

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

export type CreateUserExtraDataInput = Omit<
  UserExtraDataSchema,
  'id' | 'created_at' | 'updated_at' | 'media_size' | 'media_count' | 'projects_count' | 'clients_count' | 'services_count' | 'storage_requests_count' | 'last_storage_request_date'
>;
export type UpdateUserExtraDataInput = Partial<CreateUserExtraDataInput>;