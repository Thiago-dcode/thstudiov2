import { EnumType, TABLES_ENUM } from '../constants/enums';
import { TableColumn } from '../types/database';

export type RoleSchema = {
  id: number;
  name: EnumType<'USER_ROLE'>;
  created_at: Date;
  updated_at: Date;
};

export type RoleSchemaWithoutTimestamps = Omit<
  RoleSchema,
  'created_at' | 'updated_at'
>;

const tablesRole = [TABLES_ENUM.ROLES] as const;
export type RoleSchemaColumns = TableColumn<
  typeof tablesRole,
  RoleSchemaWithoutTimestamps
>;
