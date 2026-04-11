import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

export type AboutPageSchema = {
  id: number;
  title?: string | null;
  photo?: string | null;
  description: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type AboutPageSchemaWithoutTimestamps = Omit<AboutPageSchema, 'created_at' | 'updated_at'>;

const tablesAboutPage = [TABLES_ENUM.ABOUT_PAGE] as const;
export type AboutPageSchemaColumns = TableColumn<typeof tablesAboutPage, AboutPageSchemaWithoutTimestamps>;

