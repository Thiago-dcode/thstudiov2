import { WaitListSchema } from "../schemas/wait-list";

export type WaitList = Omit<WaitListSchema, 'created_at' | 'updated_at'>;

export type PublicCreateWaitListInput = {
  email: string;
};

export type WaitListPosition = {
  position: number;
};

export type CreateWaitListInput = Omit<WaitListSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateWaitListInput = Partial<Omit<WaitListSchema, 'id' | 'email' | 'created_at' | 'updated_at'>>;
