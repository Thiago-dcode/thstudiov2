import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RequestService } from 'src/common/services/request.service';
import { UserExtraDataService } from 'src/v1/modules/user-extra-data/user-extra-data.service';

@Injectable()
export class AiConsumptionGuard implements CanActivate {
  constructor(
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') return true;
    const user = this.requestService.user;
    if (!user) return true;

    await this.userExtraDataService.enforceUserLimits(user.id, {
      enforceAiCredits: true,
    });

    return true;
  }
}
