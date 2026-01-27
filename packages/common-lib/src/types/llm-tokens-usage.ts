import { LlmTokensUsageSchema } from "../schemas/llm-tokens-usage";
import { OffsetPaginationRequest } from "./request";

// LlmTokensUsage with timestamps
export type LlmTokensUsage = LlmTokensUsageSchema;

export type CreateLlmTokensUsageInput = Omit<LlmTokensUsageSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateLlmTokensUsageInput = Partial<CreateLlmTokensUsageInput>;

export type LlmTokensUsageIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  created_at_from?: Date;
  created_at_to?: Date;
};

