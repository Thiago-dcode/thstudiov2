import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== MEDIA MODERATION SCHEMA ====================
export type MediaModerationSchema = {
  id: number;
  is_allowed: boolean;
  severity: number;
  content_type: string;
  reason: string | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type MediaModerationSchemaWithoutTimestamps = Omit<MediaModerationSchema, 'created_at' | 'updated_at'>;

const tablesMediaModeration = [TABLES_ENUM.MEDIA_MODERATIONS] as const;
export type MediaModerationSchemaColumns = TableColumn<typeof tablesMediaModeration, MediaModerationSchema>;

