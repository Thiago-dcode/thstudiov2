import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPlanTransactionDto } from './create-user-plan-transaction.dto';

export class UpdateUserPlanTransactionDto extends PartialType(CreateUserPlanTransactionDto) {}
