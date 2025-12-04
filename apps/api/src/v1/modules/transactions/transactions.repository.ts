import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  TransactionSchema,
  TransactionColumns,
  CreateTransactionInput,
} from '@repo/common-lib/schemas/transaction';

@Injectable()
export class TransactionsRepository extends BaseRepository {
  private readonly COLUMNS: TransactionColumns[] = [
    'transactions.id',
    'transactions.transaction_id',
    'transactions.status',
    'transactions.payment_status',
    'transactions.payment_method',
    'transactions.product_type',
    'transactions.amount',
    'transactions.user_id',
    'transactions.plan_price_id',
  ];

  constructor() {
    super('transactions');
  }

  async applyFilters(filters: any) {
    console.log(filters);
  }

  async create(
    createTransaction: CreateTransactionInput,
  ): Promise<TransactionSchema> {
    const columns = Object.keys(createTransaction);
    const values = Object.values(createTransaction) as any[];
    return await this.queryBuilder.insertAndGet<TransactionSchema>(
      columns,
      values,
      this.COLUMNS,
    );
  }
}
