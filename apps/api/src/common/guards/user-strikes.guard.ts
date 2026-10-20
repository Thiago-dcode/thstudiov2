import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_WHILE_STRIKE_BANNED_KEY } from 'src/common/decorators/allow-while-strike-banned.decorator';
import { UserLimits } from '@repo/common-lib/utils/user-limits';
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
    // A ban is active while `ban_lift` is ahead, full stop. `account_strikes` is recounted from
    // `ban_start`, so it drops to 0 the moment a ban begins; also requiring it to be at
    // STRIKES_TO_BAN meant no temporary ban was ever enforced.
    if (!UserLimits.accountStrikes({ userExtraData: extraData })) {
      throw ApiException.accountStrikesExceeded(
        `Account banned until ${new Date(extraData.ban_lift).toISOString()}. Strikes: ${extraData.account_strikes}`,
      );
    }

    return true;
  }
}
