import { IsOptional, IsString } from 'class-validator';

export class CreateAssetRequest {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  filename?: string;

  @IsOptional()
  asset: Express.Multer.File;
}
