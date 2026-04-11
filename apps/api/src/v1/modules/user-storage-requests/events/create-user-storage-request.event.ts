import { CreateUserStorageRequestInput } from "@repo/common-lib/types/user-storage-request";

export class CreateUserStorageRequestEvent {
  constructor(
    public readonly storageRequest: CreateUserStorageRequestInput,
  ) {}
}
