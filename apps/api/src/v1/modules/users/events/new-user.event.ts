import { BaseUser } from '@repo/common-lib/types/user';

export class NewUserEvent {

  constructor(public readonly user: BaseUser) {}
}
