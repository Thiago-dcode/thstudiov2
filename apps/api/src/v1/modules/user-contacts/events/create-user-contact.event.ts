import { CreateUserContactInput } from "@repo/common-lib/types/user-contact";

export class CreateUserContactEvent {
  constructor(
    public readonly contactRequest: CreateUserContactInput,
  ) {}
}
