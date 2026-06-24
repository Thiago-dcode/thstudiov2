import { AssetSchema } from "../schemas/assets";

export type Asset = AssetSchema;

export type CreateAssetInput = Omit<AssetSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateAssetInput = Partial<Pick<AssetSchema, 'title' | 'description' | 'slug'>>;
