import { EnumType } from '../constants/enums';
import { AI_CREDIT_COST_BY_LLM_USAGE_TYPE } from '../constants/limits';

/**
 * Single source of truth for how many AI credits a generation costs, and which `usage_type` a
 * media metadata call should be billed under. Shared by the API, the worker and the frontend so
 * the price of an action can never drift between where it is charged and where it is displayed.
 */
export class AiCreditsHelper {
  /**
   * The `llm_tokens_usage.usage_type` a media metadata generation should be recorded under.
   * A video's call analyzes multiple sampled frames instead of one still, so it is billed under
   * its own type — never inferred from how many URLs were actually sent, so a legacy video
   * falling back to a single poster frame still bills as a video.
   */
  static metadataUsageType(
    mediaType: EnumType<'MEDIA_TYPE'> | null | undefined,
  ): EnumType<'LLM_USAGE_TYPE'> {
    return mediaType === 'VIDEO' ? 'GENERATE_MEDIA_METADATA_VIDEO' : 'GENERATE_MEDIA_METADATA';
  }

  /** AI credit cost of generating metadata for a given media type. */
  static metadataCreditCost(mediaType: EnumType<'MEDIA_TYPE'> | null | undefined): number {
    return AiCreditsHelper.creditCost(AiCreditsHelper.metadataUsageType(mediaType));
  }

  /** Credit weight of one `llm_tokens_usage` row. `0` for usage types that do not consume credits. */
  static creditCost(usageType: EnumType<'LLM_USAGE_TYPE'>): number {
    return (
      (AI_CREDIT_COST_BY_LLM_USAGE_TYPE as Partial<Record<EnumType<'LLM_USAGE_TYPE'>, number>>)[
        usageType
      ] ?? 0
    );
  }

  /** Weighted sum of AI credits consumed by a set of usage rows (already filtered by caller). */
  static consumedFromUsageRows(
    rows: Pick<{ usage_type: EnumType<'LLM_USAGE_TYPE'> }, 'usage_type'>[],
  ): number {
    return rows.reduce((sum, row) => sum + AiCreditsHelper.creditCost(row.usage_type), 0);
  }
}
