import { GenerateEntityMetadataPayload } from '@repo/common-lib/types/ai';

export class GenerateEntityMetadataEvent {
  constructor(
    public readonly payload: GenerateEntityMetadataPayload,
  ) {}
}
