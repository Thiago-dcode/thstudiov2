import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginRequest } from './requests/login.request';
import { UserRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorAuth, UserAuth, UserPayload, UserTwofa } from '@repo/common-lib/types/auth';
import { ConfigService } from '@nestjs/config';
import { BaseUser } from '@repo/common-lib/types/user';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { randomStr } from '@repo/common-lib/utils/random-string';
import { addMinutes } from 'date-fns/addMinutes';
import { UserAuthDevice } from '@repo/common-lib/types/user-session';
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
import { RegisterRequest } from './requests/register.request';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewUserEvent } from '../users/events/new-user.event';
import { DEFAULT_LANGUAGE, NEW_USER_EVENT } from '@repo/common-lib/constants/constants';
import { RoleService } from '../roles/roles.service';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { UserBenefitService } from '../user-benefit/user-benefit.service';
import { WaitListService } from '../wait-list/wait-list.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { InvitationLink } from '@repo/common-lib/types/invitation-link';
import { WaitList } from '@repo/common-lib/types/wait-list';

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
    private readonly eventEmitter: EventEmitter2,
    private readonly roleService: RoleService,
    private readonly invitationLinkService: InvitationLinkService,
    private readonly userBenefitService: UserBenefitService,
    private readonly waitListService: WaitListService,
    private readonly logService: LogService
  ) { }
  async register(registerRequest: RegisterRequest) {
    const clientRole = await this.roleService.getByName('ARTIST');

    let benefit_id: number | null = null;
    let invitationLink: InvitationLink | null = null;
    let waitList: WaitList | null = null;
    if (registerRequest.invitation_code) {
      invitationLink = await this.invitationLinkService.validateCode(registerRequest.invitation_code);
      if (invitationLink) {
        benefit_id = invitationLink.benefit_id;
        waitList = await this.waitListService.findByInvitationLinkId(invitationLink.id);
        if (waitList && waitList.email.toLowerCase() !== registerRequest.email.toLowerCase()) {
          throw new BadRequestException(
            'We detected this invitation comes from a wait list, so you must register with the same email address',
          );
        }
      }

    }
    if (!waitList) {
      //Prevent register with reserved email from wait list
      const existingWaitListEntry = await this.waitListService.findByEmail(registerRequest.email);
      if (existingWaitListEntry?.validated_at) {
        const isExpired = existingWaitListEntry.expires_at
          ? existingWaitListEntry.expires_at.getTime() <= new Date().getTime()
          : false;

        if (!isExpired) {
          throw new BadRequestException('Email already in use');
        }
      }
    }
    const { invitation_code, ...rest } = registerRequest;
    const user = await this.userRepository.create({
      ...rest,
      // Explicit: never trust a spread from the request for the email-proof gate.
      email_validated: false,
      public_id: await generateUUID(),
      funnel_step: 1,
      username_reset_count: 0,
      password_reset_count: 0,
      benefit_id,
      invitation_link_id: invitationLink ? invitationLink.id : null,
      password: await hash(registerRequest.password),
      role_id: clientRole.id,
      language: this.requestService.language ?? DEFAULT_LANGUAGE,
    });
    if (invitationLink) {
      await this.invitationLinkService.updateById(invitationLink.id, {
        current_uses: invitationLink.current_uses + 1,
        active: invitationLink.max_uses < invitationLink.current_uses + 1
      })
    }
    if (waitList) {
      await this.waitListService.updateById(waitList.id, {
        status: 'REGISTERED',
        redeemed_at: new Date(),
      });
    }
    if (benefit_id) {
      await this.userBenefitService.create(user.id, benefit_id);
    }
    const result = await this.handle2fa(user, {
      ip_address: this.requestService.ip_address,
      user_agent: this.requestService.user_agent,
    });

    this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user));
    return { ...result.user, need_twofa: true };
  }
  async login(authLoginRequest: LoginRequest): Promise<UserAuth | UserTwofa> {
    const user = await this.userRepository.findOneByWithSecrets(
      'email',
      authLoginRequest.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.banned) {
      throw new UnauthorizedException(user.banned_reason || 'Account permanentely banned')
    }

    const isPasswordValid = await compare(
      authLoginRequest.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    delete user.password;
    delete user.twofa_code;
    const result = await this.handle2fa(user, {
      user_agent: this.requestService?.user_agent || '-',
      ip_address: this.requestService?.ip_address || '-',
    });
    return result.need_2fa
      ? { ...result.user, token: null, need_twofa: true }
      : await this.handleLogin(user, result.user_auth_device);
  }
  async verify2fa(verify2faRequest: Verify2faRequest) {
    const user = await this.userRepository.findOneByWithSecrets(
      'email',
      verify2faRequest.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.banned) {
      throw new UnauthorizedException(user.banned_reason || 'Account permanently banned');
    }
    const isCodeValid = await compare(verify2faRequest.twofa_code, user.twofa_code);
    const isExpired = compareAsc(user.twofa_expires_at, new Date()) === -1;

    if (!isCodeValid || isExpired) {
      // `MAX_TWOFA_ATTEMPTS` and the `twofa_attempts` column existed but nothing ever
      // read or incremented them, so a 6-character code could be brute-forced freely.
      // Burn the code once the budget is spent; the user must restart the login flow.
      const attempts = (user.twofa_attempts ?? 0) + 1;
      const maxAttempts =
        this.configService.get<number>('api.maxTwofaAttempts') ?? 3;

      await this.userRepository.updateById(
        user.id,
        attempts >= maxAttempts
          ? { twofa_attempts: 0, twofa_code: null, twofa_expires_at: null }
          : { twofa_attempts: attempts },
      );

      throw new BadRequestException('Invalid verification code or expired');
    }
    //It should be have been created from the login process
    const userAuthDevice = await this.userAuthDevicesService.getOneOrCreate({
      user_id: user.id,
      user_agent: this.requestService?.user_agent || '-',
      ip_address: this.requestService?.ip_address || '-',
      disabled: false,
      blocked_at: null,
    });
    if (userAuthDevice.blocked_at) {
      throw new ForbiddenException('Device is blocked');
    }

    const [_, updatedUser] = await Promise.all([
      this.userAuthDevicesService.update(userAuthDevice.id, {
        disabled: false,
      }),
      this.userRepository.updateById(user.id, {
        twofa_code: null,
        twofa_expires_at: null,
        twofa_attempts: 0,
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
    if (!authDevice || authDevice.disabled || authDevice.blocked_at) {
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
  async passwordRecovery({ email }: PasswordRecoveryRequest) {
    // Built server-side, never taken from the request. When this came from the client
    // an attacker could pass their own URL and the victim would receive a genuine,
    // correctly-branded recovery email whose button carried the valid `code` to the
    // attacker's site — a one-click account takeover.
    const fallback_url = `${this.configService.get<string>('app.url')}/auth/password-recovery/recover`;
    const user = await this.userRepository.findOneBy('email', email);
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    let passwordRecoveryAttempt =
      await this.passwordRecoveryAttemptsService.findOneNotExpiredByUserId(
        user.id,
      );

    if (passwordRecoveryAttempt) {
      // 1 min 30 seconds
      const minTime = 1000 * 60 * 1.5;
      const timeDifference =
        new Date().getTime() - passwordRecoveryAttempt.updated_at.getTime();
      if (timeDifference < minTime) {
        throw new BadRequestException(
          'You can only request a password recovery once every 1 minute and 30 seconds',
        );
      }
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

    this.mailService
      .send(this.passwordRecoveryMail.setData(user, passwordRecoveryAttempt, user.language))
      .catch((error: Error) =>
        this.logService.error('Failed to send password recovery email', {
          message: error?.message,
          stack: error?.stack,
          userId: user.id,
        }),
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
      blocked_at: null,
    });
    if (userDevice.blocked_at) {
      throw new ForbiddenException('Device is blocked');
    }
    if (!user.twofa_enabled || !userDevice.disabled) {
      return { user_auth_device: userDevice, user, need_2fa: false };
    }

    //Start 2fa process

    const code = randomStr(6).toLowerCase();
    const hashedCode = await hash(code);
    const expiresAt = addMinutes(new Date(), 10);
    const updatedUser = await this.userRepository.updateById(user.id, {
      twofa_code: hashedCode,
      twofa_expires_at: expiresAt,
    });
    this.mailService
      .send(this.twoFAMail.setUser({ ...updatedUser, twofa_code: code }, updatedUser.language))
      .catch((error: Error) =>
        this.logService.error('Failed to send 2FA email', {
          message: error?.message,
          stack: error?.stack,
          userId: updatedUser.id,
        }),
      );
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
