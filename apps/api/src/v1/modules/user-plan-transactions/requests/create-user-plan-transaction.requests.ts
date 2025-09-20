import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class CreateUserPlanTransactionRequest {
  @IsAvailableEnum('TRANSACTION_STATUS')
  @IsNotEmpty()
  status: string;

  @IsAvailableEnum('PAYMENT_STATUS')
  @IsNotEmpty()
  payment_status: string;

  @IsOptional()
  @IsAvailableEnum('PAYMENT_METHOD')
  payment_method?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @ModelExist('users')
  user_id: number;

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
}
