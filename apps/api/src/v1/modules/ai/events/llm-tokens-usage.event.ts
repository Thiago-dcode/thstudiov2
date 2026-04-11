import { CreateLlmTokensUsageInput } from '@repo/common-lib/types/llm-tokens-usage';

export class LlmTokensUsageEvent {
  constructor(
    public readonly usage: CreateLlmTokensUsageInput,
  ) {}
}

