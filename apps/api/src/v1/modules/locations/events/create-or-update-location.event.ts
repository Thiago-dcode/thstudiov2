import type { CreateOrUpdateLocationPayload } from '@repo/common-lib/types/location';

export class CreateOrUpdateLocationEvent {
  constructor(public readonly payload: CreateOrUpdateLocationPayload) {}
}
