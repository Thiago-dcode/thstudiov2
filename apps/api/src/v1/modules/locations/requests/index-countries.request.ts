import { IsOptional, IsString } from 'class-validator';

export class IndexCountriesRequest {
  @IsOptional()
  @IsString()
  text?: string;
}
