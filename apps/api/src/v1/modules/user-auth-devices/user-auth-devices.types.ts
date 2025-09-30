import { UserAuthDeviceSchema } from "@repo/database/schemas/user-sessions";

export type UserAuthDevice = Omit<UserAuthDeviceSchema, 'created_at' | 'updated_at'>;