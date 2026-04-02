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
};

// Fields generated internally by the system (user cannot set these)
type InternalServiceFields = 'id' | 'created_at' | 'updated_at' | 'is_featured' | 'is_highlight';

// What users can provide when creating a service (public API input)
export type CreateServiceInput = Omit<ServiceSchema, InternalServiceFields | 'thumbnail'> & {
  thumbnail?: string;
  features?: { title: string }[];
  terms?: { title: string }[];
};

// For client-side usage with file upload
export type CreateServiceInputWithFile = Omit<CreateServiceInput, 'thumbnail'> & {
  thumbnail?: File;
};

// What users can update
export type UpdateServiceInput = Partial<Omit<ServiceSchema, InternalServiceFields>> & {
  features?: { id?: number; title: string }[];
  terms?: { id?: number; title: string }[];
};

// For client-side update with file upload
export type UpdateServiceInputWithFile = Omit<UpdateServiceInput, 'thumbnail'> & {
  thumbnail?: File;
};
