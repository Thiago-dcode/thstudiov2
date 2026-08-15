import { TABLES_ENUM } from '../constants/enums';
import { TableColumn } from '../types/database';

export type ProfileStatusSchema = {
  id: number;
  user_id: number;
  has_full_name_field: boolean;
  has_profession_field: boolean;
  has_avatar_field: boolean;
  has_location: boolean;
  has_categories: boolean;
  has_portfolio: boolean;
  has_media: boolean;
  has_about_page: boolean;
  created_at: Date;
  updated_at: Date;
};

export type ProfileStatusSchemaWithoutTimestamps = Omit<
  ProfileStatusSchema,
  'created_at' | 'updated_at'
>;

const tablesProfileStatus = [TABLES_ENUM.PROFILE_STATUS] as const;
export type ProfileStatusSchemaColumns = TableColumn<
  typeof tablesProfileStatus,
  ProfileStatusSchemaWithoutTimestamps
>;
