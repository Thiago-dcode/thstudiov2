import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ModelExistPipe } from './model-exist.pipe';
import { Query } from '@repo/database/facades';

@Injectable()
export class IsResourceBlockedPipe extends ModelExistPipe {
  async transform(value: any) {
    const _value = parseInt(value);

    const isNotBlocked = await Query.table(this.tableName).where(this.column, _value).where('blocked_at', null).exists();

    if (!isNotBlocked) {

      throw new UnauthorizedException(`This content is blocked ${this.tableName}`);
    }

    return value;
  }
}
