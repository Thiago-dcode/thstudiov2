import {
  Injectable,
  mixin,
  PipeTransform,
  UnauthorizedException,
  UnprocessableEntityException,
  type Type,
} from '@nestjs/common';
import type { SqlValue, TableName } from '@repo/common-lib/types/database';
import AlterBuilder from '@repo/database/alterBuilder';
import { Query, Schema } from '@repo/database/facades';
import { RequestService } from 'src/common/services/request.service';

/**
 * Route param must identify a row in `tableName` owned by the caller.
 *
 * `@Param('id', ParseIntPipe, IsUserOwnerPipe('media'))`
 */
export function IsUserOwnerPipe(
  tableName: TableName,
  modelColumn: string = 'id',
  userColumn: string = 'user_id',
): Type<PipeTransform> {
  @Injectable()
  class MixinIsUserOwnerPipe implements PipeTransform {
    constructor(private readonly requestService: RequestService) {}

    async transform(value: SqlValue) {
      const user = this.requestService.user;
      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const schemaBuilder = await Schema.tableIfExists(tableName);
      if (!schemaBuilder) {
        throw new UnprocessableEntityException(`Table ${tableName} does not exist`);
      }

      const modelColumnExist = await AlterBuilder.table(tableName).columnExist(
        modelColumn,
      );
      if (!modelColumnExist) {
        throw new UnprocessableEntityException(
          `Column ${modelColumn} does not exist in ${tableName}`,
        );
      }

      const userColumnExist = await AlterBuilder.table(tableName).columnExist(
        userColumn,
      );
      if (!userColumnExist) {
        throw new UnprocessableEntityException(
          `Column ${userColumn} does not exist in ${tableName}`,
        );
      }

      const exists = await Query.table(tableName)
        .where(modelColumn, '=', value)
        .where(userColumn, '=', user.id)
        .exists();
      if (!exists) {
        throw new UnprocessableEntityException(
          `${tableName} with ${modelColumn} ${value} does not exist`,
        );
      }

      return value;
    }
  }

  return mixin(MixinIsUserOwnerPipe);
}
