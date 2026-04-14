import type { EnumType } from '@repo/common-lib/constants/enums';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class InitiatePlanSubscriptionRequest {
  @IsInt()
  @IsPositive()
  @ModelExist('plan_prices')
  plan_price_id: number;

  @IsNotEmpty()
  @IsString()
  @IsAvailableEnum('PAYMENT_METHOD')
  payment_method: EnumType<'PAYMENT_METHOD'>;

  // @IsOptional()
  // @IsInt()
  // @IsPositive()
  // @ModelExist('plan_offers')
  // plan_offer_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @ModelExist('benefits')
  benefit_id?: number;

  @IsString()
  success_url: string;

  @IsString()
  cancel_url: string;


}
