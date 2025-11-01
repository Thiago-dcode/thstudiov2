import { UserAuthDeviceSchema } from "@repo/common-lib/schemas/user-session";

export type UserAuthDevice = Omit<UserAuthDeviceSchema, 'created_at' | 'updated_at'>;