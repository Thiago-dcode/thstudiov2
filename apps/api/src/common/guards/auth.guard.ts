import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { RequestService } from 'src/common/services/request.service';
import { USER_ID_HEADER } from '@repo/common-lib/constants/constants';
import { UserService } from 'src/v1/modules/users/users.service';
import { AuthHelper } from 'src/v1/modules/auth/auth-helper.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private requestService: RequestService,
    private reflector: Reflector,
    private userService: UserService,
    private authHelper: AuthHelper
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.requestService.user = null;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    this.requestService.user = await this.authHelper.resolveUserAuth(token);
    request[USER_ID_HEADER] = this.requestService.user.id;

    const currentLanguage = this.requestService.language;
    if (currentLanguage && currentLanguage != this.requestService.user.language) {
      this.userService
        .updateLanguageIfChanged(this.requestService.user.id, currentLanguage)
        .catch(() => { });
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
