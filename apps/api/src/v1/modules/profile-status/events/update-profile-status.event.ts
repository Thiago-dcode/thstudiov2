import type { UpdateProfileStatusInput } from '@repo/common-lib/types/profile-status';

export class UpdateProfileStatusEvent {
  constructor(
    public readonly userId: number,
    public readonly fields: UpdateProfileStatusInput,
  ) {}
}
