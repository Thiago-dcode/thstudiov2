import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPlanTransactionRequest } from './create-user-plan-transaction.requests';

export class UpdateUserPlanTransactionRequest extends PartialType(CreateUserPlanTransactionRequest) {}
