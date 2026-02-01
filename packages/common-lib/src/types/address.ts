import { AddressSchema } from "../schemas/address";
import { OffsetPaginationRequest } from "./request";

// ==================== ADDRESS TYPES ====================

// Address with timestamps
export type Address = AddressSchema;

export type AddressIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  client_id?: number;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

// Fields generated internally by the system (user cannot set these)
type InternalAddressFields = 'id' | 'created_at' | 'updated_at';

// What users can provide when creating address (public API input)
export type PublicCreateAddressInput = Omit<AddressSchema, InternalAddressFields>;

// What the internal service uses to create address (includes system-generated fields)
export type CreateAddressInput = Omit<AddressSchema, 'id' | 'created_at' | 'updated_at'>;

// What users can update
export type UpdateAddressInput = Partial<Omit<AddressSchema, InternalAddressFields>>;

