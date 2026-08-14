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
  /** Distinct content tags aggregated across the collection's media, localized (detail fetch only). */
  tags?: string[];
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
  | 'is_featured'
  | 'seo_title'
  | 'seo_description'
  | 'seo_generated_at'
  | 'is_indexable';

export type CreateCollectionInput = Omit<CollectionSchema, InternalCollectionFields | 'is_active'> & {
  is_active?: boolean;
  media?: { id: number; position: number }[];
};

/**
 * What the client actually sends. The slug is derived from the title by the API and frozen
 * at creation, so clients never supply one — `CreateCollectionInput` keeps `slug` because it
 * is also the repository's write shape.
 */
export type CreateCollectionPayload = Omit<CreateCollectionInput, 'slug'>;

/**
 * Single source of truth for the create/update collection form.
 * Media is kept as full objects (for the UI) instead of `{ id, position }`.
 */
export type CollectionInput = Partial<Omit<CreateCollectionPayload, 'media'>> & {
  media: FullCollectionMedia[];
};

export type UpdateCollectionInput = Partial<
  Omit<CollectionSchema, InternalCollectionFields>
> & {
  media: { id: number; position: number }[];
};

/** Update payload as sent by the client. Renaming never re-slugs, so `slug` is not sendable. */
export type UpdateCollectionPayload = Omit<UpdateCollectionInput, 'slug'>;
