import { CollectionSchema } from "../schemas/collection";
import { OffsetPaginationRequest } from "./request";
import { MediaPortfolio } from "./media";

// ==================== COLLECTION TYPES ====================

export type CollectionPortfolio = Pick<CollectionSchema, 'id' | 'title' | 'slug' | 'is_featured' | 'is_highlight' | 'is_active' | 'description'> & {
  position: number
};

export type CollectionMedia = Pick<MediaPortfolio, 'id' | 'thumbnail' | 'title' | 'position'>;

export type FullCollectionMedia =MediaPortfolio;

export type Collection = CollectionSchema & {
  media: CollectionMedia[];
};

export type FullCollection = CollectionSchema & {
  media: FullCollectionMedia[];
};

// Collection attached to a portfolio via `portfolio_collection`.
// `position` refers to the collection's position within the portfolio.
export type PortfolioCollection = Collection & {
  position: number;
  media: CollectionMedia[];
};

// Collection attached to a portfolio via `portfolio_collection`.
// `position` refers to the collection's position within the portfolio.
export type FullPortfolioCollection = Omit<Collection, 'media'> & {
  position: number;
  media: FullCollectionMedia[];
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

/**
 * Single source of truth for the create/update collection form.
 * Media is kept as full objects (for the UI) instead of `{ id, position }`.
 */
export type CollectionInput = Partial<Omit<CreateCollectionInput, 'media'>> & {
  media: FullCollectionMedia[];
};

export type UpdateCollectionInput = Partial<
  Omit<CollectionSchema, 'id' | 'created_at' | 'updated_at' | 'is_featured'>
> & {
  media: { id: number; position: number }[];
};
