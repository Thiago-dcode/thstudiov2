import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { IsUserAuth } from 'src/common/validators/is-user-auth.validtor';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class UpdateAddressRequest {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  formated_address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  street?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  zip?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  country_code?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @ModelExist('users')
  @IsUserAuth()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  @ModelExist('clients')
  client_id?: number;
}
