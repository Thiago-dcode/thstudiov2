import { PortfolioSchema } from "../schemas/portfolio";
import { CollectionSchema } from "../schemas/collection";
import { OffsetPaginationRequest } from "./request";
import { MediaPortfolio } from "./media";

// ==================== PORTFOLIO TYPES ====================

// Portfolio base type
export type Portfolio = PortfolioSchema;

// Portfolio with nested media and collections (formatted output from joins)

export type FullPortfolio = Portfolio & {
  media: MediaPortfolio[];
  collections: CollectionSchema[];
};

// Request type for listing portfolios
export type PortfolioIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
};

// Fields generated internally by the system (user cannot set these)
type InternalPortfolioFields =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'highlight'
  | 'user_highlight';

// What users can provide when creating a portfolio (public API input)
export type CreatePortfolioInput = Omit<PortfolioSchema, InternalPortfolioFields | 'thumbnail'> & {
  thumbnail: string;
  media?: {
    id: number,
    position: number
  }[],
  collections?: {
    id: number,
    position: number
  }[],
};

// For client-side usage with file upload
export type CreatePortfolioInputWithFile = Omit<CreatePortfolioInput, 'thumbnail'> & {
  thumbnail: File;
};

// What users can update (`user_highlight` / `highlight` use DB defaults on create; optional partial updates allowed except platform `highlight`, which stays internal-only via Omit)
export type UpdatePortfolioInput = Partial<
  Omit<PortfolioSchema, 'id' | 'created_at' | 'updated_at' | 'highlight'>
> & {
  media: {
    id: number;
    position: number;
  }[];
  collections: {
    id: number;
    position: number;
  }[];
};

// For client-side update with file upload
export type UpdatePortfolioInputWithFile = Omit<UpdatePortfolioInput, 'thumbnail'> & {
  thumbnail?: File;
};
