import { ServiceSchema, ServiceFeatureSchema, ServiceTermSchema } from "../schemas/service";
import { OffsetPaginationRequest } from "./request";

// ==================== SERVICE TYPES ====================

// Service base type (no relations)
export type Service = ServiceSchema;

// Service with nested features and terms (formatted output from joins)
export type FullService = Service & {
  features: Pick<ServiceFeatureSchema, 'id' | 'title'>[];
  terms: Pick<ServiceTermSchema, 'id' | 'title'>[];
  portfolio?:{
    id:number,
    title:string,
    slug:string,
    is_featured?: boolean,
    is_highlight?: boolean,
  }
};

// Request type for listing services
export type ServiceIndexRequest = OffsetPaginationRequest & {
  user_id?: number;
  is_featured?: boolean;
  is_highlight?: boolean;
  is_active?: boolean;
  blocked?: boolean;
};

// Fields generated internally by the system (user cannot set these)
type InternalServiceFields =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'is_featured'
  | 'seo_title'
  | 'seo_description'
  | 'seo_generated_at'
  | 'is_indexable';

// What users can provide when creating a service (public API input)
export type CreateServiceInput = Omit<
  ServiceSchema,
  InternalServiceFields | 'thumbnail' | 'is_highlight'
> & {
  thumbnail?: string;
  is_highlight?: boolean;
  features?: { title: string }[];
  terms?: { title: string }[];
};

// For client-side usage with file upload
export type CreateServiceInputWithFile = Omit<CreateServiceInput, 'thumbnail'> & {
  thumbnail?: File;
};

/**
 * What the client actually sends. The slug is derived from the title by the API and frozen
 * at creation, so clients never supply one — `CreateServiceInput` keeps `slug` because it is
 * also the repository's write shape.
 */
export type CreateServicePayload = Omit<CreateServiceInputWithFile, 'slug'>;

// What users can update
export type UpdateServiceInput = Partial<Omit<ServiceSchema, InternalServiceFields>> & {
  features?: { id?: number; title: string }[];
  terms?: { id?: number; title: string }[];
};

// For client-side update with file upload
export type UpdateServiceInputWithFile = Omit<UpdateServiceInput, 'thumbnail'> & {
  thumbnail?: File;
};

/** Update payload as sent by the client. Renaming never re-slugs, so `slug` is not sendable. */
export type UpdateServicePayload = Omit<UpdateServiceInputWithFile, 'slug'>;
