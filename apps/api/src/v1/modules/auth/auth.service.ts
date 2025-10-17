import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginRequest } from './requests/login.request';
import { UserRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorAuth, UserAuth, UserPayload } from './auth.types';
import { ConfigService } from '@nestjs/config';
import { BaseUser } from '../users/users.types';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { randomStr } from '@repo/common-lib/utils/random-string';
import { addMinutes } from 'date-fns/addMinutes';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { addDays } from 'date-fns';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { TwoFAMail } from './mails/twofa-mail';
import { Verify2faRequest } from './requests/verify-2fa.request';
import { compareAsc } from 'date-fns/compareAsc';
import { compare, hash } from '@repo/common-lib/utils/hash';
import { PasswordRecoveryRequest } from './requests/password-recovery.request';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts/password-recovery-attempts.service';
import { PasswordRecoveryMail } from './mails/password-recovery-mail';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { CheckPasswordRecoveryAttemptRequest } from './requests/check-password-recovery.request';
import { UpdatePasswordRequest } from './requests/update-password.request';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userAuthDevicesService: UserAuthDevicesService,
    private readonly requestService: RequestService,
    private readonly userSessionsService: UserSessionsService,
    private readonly mailService: MailService,
    private readonly twoFAMail: TwoFAMail,
    private readonly passwordRecoveryMail: PasswordRecoveryMail,
    private readonly passwordRecoveryAttemptsService: PasswordRecoveryAttemptsService,
  ) {}
  async login(authLoginRequest: LoginRequest): Promise<UserAuth | BaseUser> {
    const user = await this.userRepository.findOneByColumnWithPassword(
      'email',
      authLoginRequest.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await compare(
      authLoginRequest.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    delete user.password;
    const result = await this.handle2fa(user, {
      user_agent: this.requestService?.user_agent || '-',
      ip_address: this.requestService?.ip_address || '-',
    });
    return result.need_2fa
      ? result.user
      : await this.handleLogin(user, result.user_auth_device);
  }
  async verify2fa(verify2faRequest: Verify2faRequest) {
    const user = await this.userRepository.findOneByColumnWithPassword(
      'email',
      verify2faRequest.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (
      user.twofa_code !== verify2faRequest.twofa_code ||
      compareAsc(user.twofa_expires_at, new Date()) === -1
    ) {
      throw new BadRequestException('Invalid verification code or expired');
    }
    //It should be created from the login process
    const userAuthDevice = await this.userAuthDevicesService.getOneOrCreate({
      user_id: user.id,
      user_agent: this.requestService?.user_agent || '-',
      ip_address: this.requestService?.ip_address || '-',
      disabled: false,
      blocked: false,
    });
    if (userAuthDevice.blocked) {
      throw new ForbiddenException('Device is blocked');
    }

    const [_, updatedUser] = await Promise.all([
      this.userAuthDevicesService.update(userAuthDevice.id, {
        disabled: false,
      }),
      this.userRepository.updateById(user.id, {
        twofa_code: null,
        twofa_expires_at: null,
        email_validated: true,
      }),
    ]);

    return await this.handleLogin(updatedUser, userAuthDevice);
  }
  async refreshToken() {
    const user = this.requestService.user;
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const authDevice = await this.userAuthDevicesService.getOneByAuthDevice({
      user_id: user.id,
      user_agent: this.requestService.user_agent || '-',
      ip_address: this.requestService.ip_address || '-',
    });
    if (!authDevice || authDevice.disabled || authDevice.blocked) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const exists = await this.userSessionsService.sessionExists({
      user_id: user.id,
      user_auth_device_id: authDevice.id,
      token: user.token,
    });
    if (!exists) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return await this.handleLogin(user, authDevice);
  }
  async passwordRecovery({ email, fallback_url }: PasswordRecoveryRequest) {
    const user = await this.userRepository.findOneBy('email', email, false);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    let passwordRecoveryAttempt =
      await this.passwordRecoveryAttemptsService.findOneNotExpiredByUserId(
        user.id,
      );

    if (passwordRecoveryAttempt) {
      //1 min 30 seconds
      // const minTime = 1000 * 60 * 1.5;
      // const timeDifference =
      //   new Date().getTime() - passwordRecoveryAttempt.updated_at.getTime();
      // if (timeDifference < minTime) {
      //   throw new BadRequestException(
      //     'You can only request a password recovery once every 1 minute and 30 seconds',
      //   );
      // }
    }
    //Invalidate all previous attempts
    const [_, code] = await Promise.all([
      this.passwordRecoveryAttemptsService.expireAllUserAttempts(user.id),
      generateUUID(),
    ]);

    passwordRecoveryAttempt = await this.passwordRecoveryAttemptsService.create(
      {
        user_id: user.id,
        code,
        fallback_url,
        code_validated: false,
        expires_at: addMinutes(new Date(), 10),
      },
    );

    this.mailService.send(
      this.passwordRecoveryMail.setData(user, passwordRecoveryAttempt),
    );
    return passwordRecoveryAttempt;
  }
  async checkPasswordRecoveryAttempt(
    checkPasswordRecoveryAttemptRequest: CheckPasswordRecoveryAttemptRequest,
  ) {
    const passwordRecoveryAttempt =
      await this.passwordRecoveryAttemptsService.findOneByCode(
        checkPasswordRecoveryAttemptRequest.code,
      );
    if (!passwordRecoveryAttempt) {
      throw new BadRequestException('Invalid code');
    }
    if (passwordRecoveryAttempt.code_validated) {
      throw new BadRequestException('Code already used');
    }
    if (passwordRecoveryAttempt.expires_at.getTime() < new Date().getTime()) {
      throw new BadRequestException('Code expired');
    }
    await this.passwordRecoveryAttemptsService.update(
      passwordRecoveryAttempt.id,
      {
        code_validated: true,
      },
    );
    return passwordRecoveryAttempt;
  }
  async updatePassword(updatePasswordRequest: UpdatePasswordRequest) {
    const passwordRecoveryAttempt =
      await this.passwordRecoveryAttemptsService.findOneByCode(
        updatePasswordRequest.code,
      );
    if (!passwordRecoveryAttempt) {
      throw new BadRequestException('Invalid password recovery attempt');
    }
    if (!passwordRecoveryAttempt.code_validated) {
      throw new BadRequestException('Code not validated');
    }
    if (compareAsc(passwordRecoveryAttempt.expires_at, new Date()) === -1) {
      throw new BadRequestException('Code expired');
    }

    const [updatedUser] = await Promise.all([
      this.userRepository.updateById(passwordRecoveryAttempt.user.id, {
        password: await hash(updatePasswordRequest.password),
      }),
      this.passwordRecoveryAttemptsService.update(passwordRecoveryAttempt.id, {
        expires_at: new Date(),
      }),
    ]);

    return updatedUser;
  }
  private async handleLogin(user: BaseUser, userAuthDevice: UserAuthDevice) {
    const payload: UserPayload = {
      ...user,
      user_auth_device_id: userAuthDevice.id,
    };
    if (!user.email_validated) {
      throw new UnauthorizedException('Email not validated');
    }
    const expiresAt = addDays(new Date(), 1);
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
      secret: this.configService.get('jwt.secret'),
    });
    await this.userSessionsService.handleSessionProcess({
      user_id: user.id,
      user_auth_device_id: userAuthDevice.id,
      token,
      expires_at: expiresAt,
    });
    return { ...user, token };
  }

  private async handle2fa(
    user: BaseUser,
    {
      user_agent,
      ip_address,
    }: {
      user_agent?: string;
      ip_address?: string;
    },
  ): Promise<TwoFactorAuth> {
    const userDevice = await this.userAuthDevicesService.getOneOrCreate({
      user_id: user.id,
      user_agent: user_agent || this.requestService?.user_agent || '-',
      ip_address: ip_address || this.requestService?.ip_address || '-',
      disabled: true,
      blocked: false,
    });
    if (userDevice.blocked) {
      throw new ForbiddenException('Device is blocked');
    }
    if (!user.twofa_enabled || !userDevice.disabled) {
      return { user_auth_device: userDevice, user, need_2fa: false };
    }

    //Start 2fa process

    const code = randomStr(6).toLowerCase();
    const expiresAt = addMinutes(new Date(), 30);
    const updatedUser = await this.userRepository.updateById(user.id, {
      twofa_code: code,
      twofa_expires_at: expiresAt,
    });
    this.mailService.send(this.twoFAMail.setUser(updatedUser));
    return {
      user_auth_device: userDevice,
      user: updatedUser,
      need_2fa: true,
    };
  }
  async logout() {
    const user = this.requestService.user;
    const session = await this.userSessionsService.findOneBySession({
      user_id: user.id,
      token: user.token,
    });
    if (!session) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.userSessionsService.update(session.id, {
      expires_at: new Date(),
    });
    return true;
  }
}
