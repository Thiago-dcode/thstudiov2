import { AddressSchema } from '@repo/database/schemas/addresses';
import {BaseUser} from '@repo/common-lib/types/user'
export type User = BaseUser & {
  name?: string | null;
  surname?: string | null;
  biography?: string | null;
  address?: Omit<AddressSchema, 'created_at' | 'updated_at'>;
};
