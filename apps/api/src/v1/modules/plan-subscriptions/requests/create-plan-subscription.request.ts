import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class CreatePlanSubscriptionRequest {
  @IsOptional()
  @IsString()
  stripe_id?: string;

  @IsOptional()
  @IsString()
  paypal_id?: string;


  @IsOptional()
  @IsBoolean()
  auto_renewal?: boolean;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @ModelExist('users')
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @ModelExist('plans')
  plan_id: number;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @ModelExist('plan_prices')
  plan_price_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @ModelExist('plan_offers')
  plan_offer_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @ModelExist('transactions')
  transaction_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

