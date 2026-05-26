import { PortfolioSchema } from "../schemas/portfolio";
import { OffsetPaginationRequest } from "./request";
import { MediaPortfolio } from "./media";
import { FullPortfolioCollection, PortfolioCollection } from "./collection";
import { CategoryBase } from "./category";

// ==================== PORTFOLIO TYPES ====================

// Portfolio base type
export type Portfolio = PortfolioSchema;

// Portfolio with nested media and collections (formatted output from joins)

export type FullPortfolio = Portfolio & {
  media: MediaPortfolio[];
  collections: FullPortfolioCollection[];
  categories: CategoryBase[];
};

// Request type for listing portfolios
export type PortfolioIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  is_featured?: boolean;
  is_highlight?: boolean;
  is_active?: boolean;
  blocked?: boolean;
};

// Fields generated internally by the system (user cannot set these)
type InternalPortfolioFields =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'is_featured';

// What users can provide when creating a portfolio (public API input)
export type CreatePortfolioInput = Omit<
  PortfolioSchema,
  InternalPortfolioFields | 'thumbnail' | 'is_highlight' | 'is_active'
> & {
  thumbnail: string;
  is_highlight?: boolean;
  is_active?: boolean;
  media?: {
    id: number,
    position: number
  }[],
  collections?: {
    id: number,
    position: number
  }[],
  categories?: number[],
};

// For client-side usage with file upload
export type CreatePortfolioInputWithFile = Omit<CreatePortfolioInput, 'thumbnail'> & {
  thumbnail: File;
};

/** Form state for create/update portfolio wizard (excludes nested media/collections arrays). */
export type PortfolioFormData = Partial<
  Omit<CreatePortfolioInputWithFile, 'media' | 'collections'>
>;

/** Discriminated union: use `row.item` to narrow to {@link MediaPortfolioItem} or {@link CollectionPortfolioItem}. */
export type MediaPortfolioItem = MediaPortfolio & {
  item: 'media';
};

export type CollectionPortfolioItem = PortfolioCollection & {
  item: 'collection';
};
export type FullCollectionPortfolioItem = FullPortfolioCollection & {
  item: 'collection';
};
export type PortfolioItem = MediaPortfolioItem | CollectionPortfolioItem;

export type FullPortfolioItem = MediaPortfolioItem | FullCollectionPortfolioItem;

export type UpdatePortfolioInput = Partial<
  Omit<PortfolioSchema, 'id' | 'created_at' | 'updated_at' | 'is_featured'>
> & {
  media: {
    id: number;
    position: number;
  }[];
  collections: {
    id: number;
    position: number;
  }[];
  categories?: number[];
};

// For client-side update with file upload
export type UpdatePortfolioInputWithFile = Omit<UpdatePortfolioInput, 'thumbnail'> & {
  thumbnail?: File;
};
