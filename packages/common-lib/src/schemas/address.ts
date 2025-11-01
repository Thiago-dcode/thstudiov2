export type AddressSchema = {
  id: number;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type CreateAddressInput = Omit<AddressSchema, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAddressInput = Partial<CreateAddressInput>;
