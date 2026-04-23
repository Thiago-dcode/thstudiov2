import { CollectionSchema } from "../schemas/collection";
import { OffsetPaginationRequest } from "./request";
import { MediaPortfolio } from "./media";

// ==================== COLLECTION TYPES ====================

export type CollectionMedia = Pick<MediaPortfolio, 'id' | 'thumbnail' | 'title' | 'position'>;

export type Collection = CollectionSchema & {
  media: CollectionMedia[];
};

export type FullCollection = CollectionSchema & {
  media: MediaPortfolio[];
};

// Collection attached to a portfolio via `portfolio_collection`.
// `position` refers to the collection's position within the portfolio.
export type PortfolioCollection = CollectionSchema & {
  position: number;
  media: MediaPortfolio[];
};

export type CollectionIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  is_featured?: boolean;
  is_highlight?: boolean;
  is_active?: boolean;
  blocked?: boolean;
};

type InternalCollectionFields =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'is_featured';

export type CreateCollectionInput = Omit<CollectionSchema, InternalCollectionFields | 'is_active'> & {
  is_active?: boolean;
  media?: { id: number; position: number }[];
};

export type UpdateCollectionInput = Partial<
  Omit<CollectionSchema, 'id' | 'created_at' | 'updated_at' | 'is_featured'>
> & {
  media: { id: number; position: number }[];
};
