import { CollectionSchema } from "../schemas/collection";
import { OffsetPaginationRequest } from "./request";
import { MediaPortfolio } from "./media";

// ==================== COLLECTION TYPES ====================

export type Collection = CollectionSchema;

export type FullCollection = Collection & {
  media: MediaPortfolio[];
};

export type CollectionIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  is_featured?: boolean;
  is_highlight?: boolean;
};

type InternalCollectionFields =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'is_featured';

export type CreateCollectionInput = Omit<CollectionSchema, InternalCollectionFields> & {
  media?: { id: number; position: number }[];
};

export type UpdateCollectionInput = Partial<
  Omit<CollectionSchema, 'id' | 'created_at' | 'updated_at' | 'is_featured'>
> & {
  media: { id: number; position: number }[];
};
