import { UserStorageRequestSchema } from "../schemas/user-storage-request";

// UserStorageRequest without timestamps
export type UserStorageRequest = Omit<UserStorageRequestSchema, 'created_at' | 'updated_at'>;

export type CreateUserStorageRequestInput = Omit<UserStorageRequestSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateUserStorageRequestInput = Partial<CreateUserStorageRequestInput>;

