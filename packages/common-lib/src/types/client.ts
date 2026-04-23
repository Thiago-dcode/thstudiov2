import { ClientSchema } from '../schemas/client';
import { OffsetPaginationRequest } from './request';

export type Client = ClientSchema;

export type ClientIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  blocked?: boolean;
};

type InternalClientFields = 'id' | 'created_at' | 'updated_at';

export type CreateClientInput = Omit<ClientSchema, InternalClientFields>;

export type UpdateClientInput = Partial<Omit<ClientSchema, InternalClientFields>>;
