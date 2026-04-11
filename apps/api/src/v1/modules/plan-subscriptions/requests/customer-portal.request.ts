import { IsString, MaxLength } from 'class-validator';

export class CustomerPortalRequest {
  @IsString()
  @MaxLength(2048)
  return_url: string;
}

