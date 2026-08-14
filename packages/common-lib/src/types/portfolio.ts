import { PortfolioSchema } from "../schemas/portfolio";
import { OffsetPaginationRequest } from "./request";
import { MediaPortfolio } from "./media";
import { FullPortfolioCollection, PortfolioCollection } from "./collection";
import { CategoryBase } from "./category";
import { CompactUser } from "./user";
import { PortfolioLayout, PortfolioLayoutInput } from "./layout";

// ==================== PORTFOLIO TYPES ====================

// Portfolio base type (always includes the owning artist from users join)
export type Portfolio = PortfolioSchema & {
  artist: CompactUser;
};

// Portfolio with nested media and collections (formatted output from joins)

export type FullPortfolio = Portfolio & {
  media: MediaPortfolio[];
  collections: FullPortfolioCollection[];
  categories: CategoryBase[];
  layout?: PortfolioLayout;
};

// Request type for listing portfolios
export type PortfolioIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  is_featured?: boolean;
  is_highlight?: boolean;
  is_active?: boolean;
  blocked?: boolean;
  search?: string;
  categories?: string[];
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
};

// Fields generated internally by the system (user cannot set these)
type InternalPortfolioFields =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'is_featured'
  | 'seo_title'
  | 'seo_description'
  | 'seo_generated_at'
  | 'is_indexable';

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
  layout?: PortfolioLayoutInput,
};

// For client-side usage with file upload
export type CreatePortfolioInputWithFile = Omit<CreatePortfolioInput, 'thumbnail'> & {
  thumbnail: File;
};

/**
 * What the client actually sends. The slug is derived from the title by the API and frozen
 * at creation, so clients never supply one — `CreatePortfolioInput` keeps `slug` because it
 * is also the repository's write shape. Use these payload types at the HTTP boundary so a
 * stray `slug` is a type error rather than a value the API silently strips.
 */
export type CreatePortfolioPayload = Omit<CreatePortfolioInputWithFile, 'slug'>;

/** Form state for create/update portfolio wizard (excludes nested media/collections arrays). */
export type PortfolioFormData = Partial<
  Omit<CreatePortfolioPayload, 'media' | 'collections'>
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
export type PortfolioItem = (MediaPortfolioItem | CollectionPortfolioItem) & {
  index?: number
};

export type FullPortfolioItem = (MediaPortfolioItem | FullCollectionPortfolioItem) & {
  index?: number
};

export type PortfolioInput = Partial<
  Omit<CreatePortfolioPayload, 'media' | 'collections' | 'categories'>
> & {
  portfolioItems: PortfolioItem[],
  categories:CategoryBase[]
  /** Current wizard step (UI state kept alongside the input for a single source of truth). */
  currentStep: number

}
export type UpdatePortfolioInput = Partial<
  Omit<PortfolioSchema, InternalPortfolioFields>
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
  layout?: PortfolioLayoutInput;
};

// For client-side update with file upload
export type UpdatePortfolioInputWithFile = Omit<UpdatePortfolioInput, 'thumbnail'> & {
  thumbnail?: File;
};

/** Update payload as sent by the client. Renaming never re-slugs, so `slug` is not sendable. */
export type UpdatePortfolioPayload = Omit<UpdatePortfolioInputWithFile, 'slug'>;
