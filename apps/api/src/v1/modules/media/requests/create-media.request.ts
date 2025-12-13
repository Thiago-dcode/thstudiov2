import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { MediaTranslationRequest } from '../media-translation/requests/media-translation.request';
import { Transform, Type } from 'class-transformer';

export class CreateMediaRequest {
  @IsString()
  @IsOptional()
  title?: string;
  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => parseInt(value))
  @ModelExist('users')
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @IsArray()
  @ValidateNested()
  @IsOptional({ each: true })
  @Type(() => MediaTranslationRequest)
  translations?: MediaTranslationRequest[];
}
