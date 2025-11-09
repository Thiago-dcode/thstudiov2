import { TableColumn } from "../types/database";
import { TABLES_ENUM } from "../constants/enums";
export type UserAuthDeviceSchema = {
  id: number;
  user_agent: string;
  ip_address: string;
  disabled: boolean;
  blocked: boolean;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};
export type UserAuthDeviceSchemaWithoutTimestamps = Omit<UserAuthDeviceSchema, 'created_at' | 'updated_at'>;
const tablesUserAuthDevice = [TABLES_ENUM.USER_AUTH_DEVICES] as const;
export type UserAuthDeviceSchemaColumns = TableColumn<typeof tablesUserAuthDevice, UserAuthDeviceSchemaWithoutTimestamps>;
export type UserSessionSchema = {
  id: number;
  token: string;
  user_id: number;
  user_auth_device_id: number;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};
const tablesUserSession = [TABLES_ENUM.USER_SESSIONS] as const;
export type UserSessionSchemaColumns = TableColumn<typeof tablesUserSession, UserSessionSchema>;
// Only prefix columns that collide between tables
export type UserSessionSchemaWithUserAuthDevice = {
  id: number;
  token: string;
  user_id: number;
  user_auth_device_id: number;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  
  uad_id: number;             
  uad_user_id: number;        
  uad_created_at: Date;       
  uad_updated_at: Date;       
  user_agent: string;
  ip_address: string;
  disabled: boolean;
  blocked: boolean;
};

const tables = [TABLES_ENUM.USER_SESSIONS, TABLES_ENUM.USER_AUTH_DEVICES] as const;
export type UserSessionSchemaWithUserAuthDeviceColumns = TableColumn<typeof tables, UserSessionSchemaWithUserAuthDevice>;
