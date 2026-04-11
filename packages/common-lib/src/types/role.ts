import { RoleSchema } from '../schemas/role';

export type Role = Omit<RoleSchema, 'created_at' | 'updated_at'>;
