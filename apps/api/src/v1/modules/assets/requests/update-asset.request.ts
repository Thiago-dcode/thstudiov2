import { IsOptional, IsString } from 'class-validator';

export class UpdateAssetRequest {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}
