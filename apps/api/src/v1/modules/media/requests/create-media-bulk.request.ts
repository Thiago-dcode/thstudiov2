import { Type } from 'class-transformer';
import { CreateMediaRequest } from './create-media.request';
import { IsArray, ValidateNested } from 'class-validator';

export class CreateMediaBulkRequest {

  
  @IsArray()
  @ValidateNested()
  @Type(() => CreateMediaRequest)
  media: CreateMediaRequest[];
}
