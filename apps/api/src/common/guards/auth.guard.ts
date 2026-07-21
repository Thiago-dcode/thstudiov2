import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { compareAsc } from 'date-fns';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { RequestService } from 'src/common/services/request.service';
import { USER_ID_HEADER } from '@repo/common-lib/constants/constants';
import { UserSessionsService } from 'src/v1/modules/user-sessions/user-sessions.service';
import { UserPayload } from '@repo/common-lib/types/auth';
import { UserService } from 'src/v1/modules/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private requestService: RequestService,
    private reflector: Reflector,
    private userSessionsService: UserSessionsService,
    private userService: UserService,
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
    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      })) as UserPayload;

      if (
        !payload ||
        !payload?.id ||
        !payload?.email ||
        !payload?.user_auth_device_id ||
        !payload?.role ||
        typeof payload.role.id !== 'number'
      ) {

        throw new UnauthorizedException();
      }
      //TODO: Verify user current session
      const session = await this.userSessionsService.findOneBySession({
        user_id: payload.id,
        user_auth_device_id: payload.user_auth_device_id,
        token,
      });
      if (
        !session ||
        !session?.expires_at ||
        compareAsc(session?.expires_at, new Date()) === -1
      ) {
        throw new UnauthorizedException('Invalid session');
      }
      request[USER_ID_HEADER] = payload.id;
      this.requestService.user = {
        token,
        email: payload.email,
        public_id: payload.public_id,
        username: payload.username,
        role: payload.role,
        email_validated: payload.email_validated,
        stripe_customer_id: payload.stripe_customer_id,
        twofa_enabled: payload.twofa_enabled,
        twofa_expires_at: payload.twofa_expires_at,
        funnel_step: payload.funnel_step,
        id: payload.id,
        is_active: payload.is_active,
        is_featured: payload.is_featured ?? false,
        benefit_id: payload.benefit_id,
        invitation_link_id: payload.invitation_link_id,
        password_reset_count: payload.password_reset_count,
        username_reset_count: payload.username_reset_count,
        next_username_reset: payload.next_username_reset,
        next_password_reset: payload.next_password_reset,
        twofa_attempts: payload.twofa_attempts,
        language: payload.language,

      };

      const currentLanguage = this.requestService.language;
      if (currentLanguage && currentLanguage != payload.language) {
        this.userService
          .updateLanguageIfChanged(payload.id, currentLanguage)
          .catch(() => {});
      }

    } catch (error) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
