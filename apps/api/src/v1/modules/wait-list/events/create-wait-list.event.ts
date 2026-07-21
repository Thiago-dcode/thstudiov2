import { CreateWaitListJobInput } from '@repo/common-lib/types/wait-list';

export class CreateWaitListEvent {
  constructor(public readonly data: CreateWaitListJobInput) {}
}
