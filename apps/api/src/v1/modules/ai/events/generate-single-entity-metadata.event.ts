import { GenerateSingleEntityMetadataPayload } from '@repo/common-lib/types/ai';

export class GenerateSingleEntityMetadataEvent {
  constructor(
    public readonly payload: GenerateSingleEntityMetadataPayload,
  ) {}
}
