import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LogService } from '@repo/backend-lib/services/log-service';
import { UserAuth, UserPayload } from '@repo/common-lib/types/auth';
import { compareAsc } from 'date-fns';
import { UserSessionsService } from 'src/v1/modules/user-sessions/user-sessions.service';

@Injectable()
export class AuthHelper {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userSessionsService: UserSessionsService,
    private logger: LogService,
  ) {}

  async resolveUserAuth(token: string): Promise<UserAuth> {
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
      return {
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
    } catch (error) {
      this.logger.error('Something went wrong in resolveUserAuth', error);
      throw new UnauthorizedException();
    }
  }
}
