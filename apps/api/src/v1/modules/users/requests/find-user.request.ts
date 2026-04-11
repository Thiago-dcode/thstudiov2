import type { EnumType } from '@repo/common-lib/constants/enums';
import {  IsOptional } from 'class-validator';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class FindUserRequest {
  @IsOptional()
  @IsAvailableEnum('FORMAT_TYPE')
  format: EnumType<'FORMAT_TYPE'> = 'FULL';
}
