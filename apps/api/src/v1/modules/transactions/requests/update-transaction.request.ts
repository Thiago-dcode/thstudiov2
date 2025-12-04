import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionRequest } from './create-transaction.request';

export class UpdateTransactionRequest extends PartialType(CreateTransactionRequest) {}

