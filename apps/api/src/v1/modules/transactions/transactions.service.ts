import { Injectable } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { EnumType } from '@repo/common-lib/constants/enums';
import { CreateTransactionRequest } from './requests/create-transaction.request';
import { UpdateTransactionRequest } from './requests/update-transaction.request';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async create({
    amount,
    user_id,
    plan_price_id,
    status,
    payment_status,
    payment_method,
    product_type,
  }: CreateTransactionRequest) {
    const result = await this.transactionsRepository.create({
      amount,
      user_id,
      plan_price_id: plan_price_id ?? null,
      status: status as EnumType<'TRANSACTION_STATUS'>,
      payment_status: payment_status as EnumType<'PAYMENT_STATUS'>,
      payment_method: payment_method as EnumType<'PAYMENT_METHOD'>,
      product_type: product_type as EnumType<'PRODUCT_TYPE'>,
      transaction_id: await generateUUID(),
    });
    return result;
  }

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionRequest) {
    console.log(id, updateTransactionDto);
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
