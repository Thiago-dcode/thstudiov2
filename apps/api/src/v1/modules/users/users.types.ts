import { AddressSchema } from '@repo/database/schemas/addresses';

export type BaseUser = {
  id: number;
  email: string;
  username: string;
  email_validated: boolean;
  twofa_enabled: boolean;
  twofa_code: string;
  twofa_expires_at: Date;
  is_active: boolean;
  twofa_attempts: number;
};
export type BaseUserWithPassword = BaseUser & {
  password: string;
};
export type User = BaseUser & {
  name?: string | null;
  surname?: string | null;
  biography?: string | null;
  address?: Omit<AddressSchema, 'created_at' | 'updated_at'>;
};
