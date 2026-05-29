import { PublicCreateWaitListInput } from '@repo/common-lib/types/wait-list';

export class CreateWaitListEvent {
  constructor(public readonly data: PublicCreateWaitListInput) {}
}
