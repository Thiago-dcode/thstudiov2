import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== LLM TOKENS USAGE SCHEMA ====================
export type LlmTokensUsageSchema = {
  id: number;
  tokens: number;
  model: string;
  user_id: number;
  usage_type: EnumType<'LLM_USAGE_TYPE'>;
  matches_expected_response: boolean;
  created_at: Date;
  updated_at: Date;
};

export type LlmTokensUsageSchemaWithoutTimestamps = Omit<LlmTokensUsageSchema, 'created_at' | 'updated_at'>;

const tablesLlmTokensUsage = [TABLES_ENUM.LLM_TOKENS_USAGE] as const;
export type LlmTokensUsageSchemaColumns = TableColumn<typeof tablesLlmTokensUsage, LlmTokensUsageSchema>;

