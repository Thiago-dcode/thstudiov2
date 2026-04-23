import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

export type ProjectSchema = {
  id: number;
  title: string;
  description?: string | null;
  status: EnumType<"PROJECT_STATUS">;
  budget?: number | null;
  is_featured: boolean;
  is_highlight: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
  payment_date?: Date | null;
  pause_date?: Date | null;
  cancel_date?: Date | null;
  complete_date?: Date | null;
  show_client: boolean;
  show_service: boolean;
  is_active: boolean;
  blocked_at?: Date | null;
  user_id: number;
  client_id: number;
  service_id: number;
  created_at: Date;
  updated_at: Date;
};

export type ProjectSchemaWithoutTimestamps = Omit<
  ProjectSchema,
  "created_at" | "updated_at"
>;

const tablesProject = [TABLES_ENUM.PROJECTS] as const;
export type ProjectSchemaColumns = TableColumn<
  typeof tablesProject,
  ProjectSchema
>;
