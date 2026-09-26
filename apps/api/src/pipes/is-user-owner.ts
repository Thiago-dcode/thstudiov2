import {
  Injectable,
  mixin,
  NotFoundException,
  PipeTransform,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';
import type { SqlValue, TableName } from '@repo/common-lib/types/database';
import { Query } from '@repo/database/facades';
import { RequestService } from 'src/common/services/request.service';

/**
 * Route param must identify a row in `tableName` owned by the caller.
 *
 * `@Param('id', ParseIntPipe, IsUserOwnerPipe('media'))`
 *
 * The table and columns are fixed at the call site, so they are not re-checked against the schema
 * on every request. A missing row and someone else's row answer the same 404, so the response
 * never tells a caller which ids exist.
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

      const exists = await Query.table(tableName)
        .where(modelColumn, '=', value)
        .where(userColumn, '=', user.id)
        .exists();
      if (!exists) {
        throw new NotFoundException(`${tableName} not found`);
      }

      return value;
    }
  }

  return mixin(MixinIsUserOwnerPipe);
}
