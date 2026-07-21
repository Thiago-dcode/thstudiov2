import { EnumType } from "../constants/enums";
import { WaitListSchema } from "../schemas/wait-list";

export type WaitList = Omit<WaitListSchema, 'created_at' | 'updated_at'>;

export type PublicCreateWaitListInput = {
  email: string;
};

/** Internal event/job payload for wait-list creation — adds the visitor's resolved language to the public input. */
export type CreateWaitListJobInput = PublicCreateWaitListInput & {
  language: EnumType<'LANGUAGE_CODE'>;
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
