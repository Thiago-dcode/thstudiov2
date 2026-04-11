import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ModelExist } from 'src/common/validators/model-exist.validtor';

export class CreateInvitationLinkRequest {


  @IsNumber()
  @IsNotEmpty()
  @ModelExist('benefits')
  benefit_id: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  max_uses?: number =1;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expires_at?: Date;
  
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
