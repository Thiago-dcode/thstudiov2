import { AddressSchema } from '@repo/database/schemas/addresses';

export type BaseUser = {
  id: number;
  email: string;
  username: string;
  email_validated: boolean;
};
export type User = BaseUser & {
  name?: string | null;
  surname?: string | null;
  biography?: string | null;
  number_email_validations_sent: number;
  address?: Exclude<AddressSchema, 'created_at' | 'updated_at'>;
};
