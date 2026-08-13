import { PipeTransform, Injectable, UnprocessableEntityException } from '@nestjs/common';
import AlterBuilder from '@repo/database/alterBuilder';
import { Query, Schema } from '@repo/database/facades';
import type { TableName } from '@repo/common-lib/types/database';

@Injectable()
export class ModelExistPipe implements PipeTransform {
  constructor(
    protected readonly tableName: TableName,
    protected readonly column: string = 'id',
  ) {}
  async transform(value: any) {
    const schemaBuilder = await Schema.tableIfExists(this.tableName);
    if (!schemaBuilder) {
      throw new UnprocessableEntityException(`Table ${this.tableName} does not exist`);
    }
    const columnExist = await AlterBuilder.table(this.tableName).columnExist(
      this.column,
    );
    if (!columnExist) {
      throw new UnprocessableEntityException(
        `Column ${this.column} does not exist in ${this.tableName} or is not of type ${typeof value}`,
      );
    }
    const exists = await Query.table(this.tableName)
      .where(this.column, '=', value)
      .exists();
    if (!exists) {
      throw new UnprocessableEntityException(
        `${this.tableName} with ${this.column} ${value} does not exist`
      );
    }
    return value;
  }
}
