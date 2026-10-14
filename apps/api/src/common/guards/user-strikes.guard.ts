import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_WHILE_STRIKE_BANNED_KEY } from 'src/common/decorators/allow-while-strike-banned.decorator';
import { STRIKES_TO_BAN } from '@repo/common-lib/constants/limits';
import { ApiException } from 'src/common/exceptions/api-exception';
import { RequestService } from 'src/common/services/request.service';
import { UserExtraDataService } from 'src/v1/modules/user-extra-data/user-extra-data.service';

@Injectable()
export class UserStrikesGuard implements CanActivate {
  constructor(
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') return true;
    if (
      this.reflector.getAllAndOverride<boolean>(ALLOW_WHILE_STRIKE_BANNED_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const user = this.requestService.user;
    if (!user) return true;

    const extraData = await this.userExtraDataService.findOneByUserId(user.id);
    if (extraData.account_strikes >= STRIKES_TO_BAN && extraData.ban_lift && new Date(extraData.ban_lift) > new Date()) {
      throw ApiException.accountStrikesExceeded(
        `Account banned until ${new Date(extraData.ban_lift).toISOString()}. Strikes: ${extraData.account_strikes}`,
      );
    }

    return true;
  }
}
