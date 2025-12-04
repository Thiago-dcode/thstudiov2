import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { IsAvailableEnum } from 'src/common/validators/is-enum.validator';

export class CreateTransactionRequest {
  @IsAvailableEnum('TRANSACTION_STATUS')
  @IsNotEmpty()
  status: string;

  @IsAvailableEnum('PAYMENT_STATUS')
  @IsNotEmpty()
  payment_status: string;

  @IsAvailableEnum('PAYMENT_METHOD')
  @IsNotEmpty()
  payment_method: string;

  @IsAvailableEnum('PRODUCT_TYPE')
  @IsNotEmpty()
  product_type: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @ModelExist('users')
  user_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @ModelExist('plan_prices')
  plan_price_id?: number;
}

