import { WaitListSchema } from "../schemas/wait-list";

export type WaitList = Omit<WaitListSchema, 'created_at' | 'updated_at'>;

export type PublicCreateWaitListInput = {
  email: string;
};

export type WaitListCreateResponse = {
  email: string;
  message: string;
  already_exists?: true;
};

export type ValidateWaitListInput = {
  token: string;
};

export type CreateWaitListInput = Omit<WaitListSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateWaitListInput = Partial<Omit<WaitListSchema, 'id' | 'email' | 'token' | 'created_at' | 'updated_at'>>;
