import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import { ApiException } from 'src/common/exceptions/api-exception';
import { LoginRequest } from './requests/login.request';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleAuthInitiate, OauthCallback, OauthCallbackResponse, OauthProviders, TwoFactorAuth, UserAuth, UserPayload, UserTwofa } from '@repo/common-lib/types/auth';
import { ConfigService } from '@nestjs/config';
import { BaseUser, BaseUserWithSecrets, CreateUserInput } from '@repo/common-lib/types/user';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import type { ApiLogger } from 'src/common/services/request.service';
import { randomInt } from 'crypto';
import { addMinutes } from 'date-fns/addMinutes';
import { UserAuthDevice } from '@repo/common-lib/types/user-session';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { addDays, differenceInSeconds, subMinutes } from 'date-fns';
import {
  TWOFA_CODE_TTL_MINUTES,
  TWOFA_MIN_REUSE_SECONDS,
  TWOFA_RESEND_COOLDOWN_SECONDS,
  USER_SESSION_TTL_DAYS,
} from '@repo/common-lib/constants/limits';
import { Resend2faRequest } from './requests/resend-2fa.request';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { TwoFAMail } from './mails/twofa-mail';
import { Verify2faRequest } from './requests/verify-2fa.request';
import { compareAsc } from 'date-fns/compareAsc';
import { compare, hash } from '@repo/common-lib/utils/hash';
import { isReservedUsername } from '@repo/common-lib/utils/username';
import { PasswordRecoveryRequest } from './requests/password-recovery.request';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts/password-recovery-attempts.service';
import { PasswordRecoveryMail } from './mails/password-recovery-mail';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { CheckPasswordRecoveryAttemptRequest } from './requests/check-password-recovery.request';
import { UpdatePasswordRequest } from './requests/update-password.request';
import { RegisterRequest } from './requests/register.request';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewUserEvent } from '../users/events/new-user.event';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import { NEW_USER_EVENT } from '@repo/common-lib/constants/events';
import { RoleService } from '../roles/roles.service';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { UserBenefitService } from '../user-benefit/user-benefit.service';
import { WaitListService } from '../wait-list/wait-list.service';
import { maskEmailAddresses } from '@repo/backend-lib/services/log-service';
import { InvitationLink } from '@repo/common-lib/types/invitation-link';
import { WaitList } from '@repo/common-lib/types/wait-list';
import { TWOFA_LOCK_TTL_MS, TWOFA_LOCK_WAIT_MS, withUserLock } from 'src/common/utils/user-lock';
import { GoogleOauth2Service } from '@repo/backend-lib/services/googleapi-service'
import { config } from '@repo/common-lib/config';
import { UserOauthProvidersService } from '../user-oauth-providers/user-oauth-providers.service';
import { EnumType } from '@repo/common-lib/constants/enums';
@Injectable()
export class AuthService {
  private readonly logService: ApiLogger;

  constructor(
    private readonly userService: UserService,
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
    private readonly googleOauth2Service: GoogleOauth2Service,
    private readonly userOauthProvidersService: UserOauthProvidersService,
  ) {
    this.logService = this.requestService.log('auth');
  }
  /**
   * Auth audit on the request-bound logger: per-call operation and subject user, never `.name()`.
   * Never the email, password, code or token; an unknown account gets no user id at all.
   */
  private audit(
    level: 'info' | 'warn' | 'error',
    operation: string,
    message: string,
    extraInfo?: Record<string, unknown>,
    userId?: number,
  ) {
    this.logService[level](message, { ...(userId ? { user_id: userId } : {}), ...extraInfo, operation });
  }

  private rejectRegistration(reason: string, invitationLinkId?: number) {
    this.audit('warn', 'register', 'Registration rejected', {
      reason,
      ...(invitationLinkId ? { invitation_link_id: invitationLinkId } : {}),
    });
  }

  async register(registerRequest: RegisterRequest) {
    const { invitationLink, waitList } = await this.resolveInvitationCodeBeforeRegister(
      registerRequest.invitation_code,
      registerRequest.email,
    );
    const benefit_id = invitationLink ? invitationLink.benefit_id : null;
    // No username at sign-up: `finishCreateUserAccount` generates a random one (reserved names
    // are skipped there) and flags it, so the first name save in onboarding replaces it once.
    const { email, password } = registerRequest;
    const user = await this.finishCreateUserAccount(
      {
        // Explicit: never trust a spread from the request for the email-proof gate.
        email_validated: false,
        email,
        password: await hash(password),
      },
      { invitationLink, waitList, role: 'ARTIST' },
    );

    const preValidated = waitList?.validated_at
      ? await this.loginPreValidatedDevice(user, waitList.email)
      : null;
    const registered = (need_twofa: boolean) =>
      this.audit('info', 'register', 'Account registered', {
        via_invitation: !!invitationLink,
        via_wait_list: !!waitList,
        benefit_id,
        pre_validated: !!preValidated,
        need_twofa,
      }, user.id);
    if (preValidated) {
      registered(false);
      this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user));
      return { ...preValidated, need_twofa: false as const };
    }

    const result = await this.handle2fa(user, {
      ip_address: this.requestService.ip_address,
      user_agent: this.requestService.user_agent,
    }, { reason: 'register' });

    registered(true);
    this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user));
    return { ...result.user, token: null, need_twofa: true as const };
  }

  /**
   * Skips the register 2FA code when this browser already proved the email by validating the
   * wait-list entry — the code would only prove the same thing again. Requires all of: the
   * registration came through that entry's invitation (so the email matches the entry), the
   * browser (user agent + IP) is the one that validated, and its device is unclaimed, unblocked
   * and recent. Any miss returns null and the caller falls back to the normal 2FA code.
   */
  private async loginPreValidatedDevice(user: BaseUser, email: string) {
    let device: UserAuthDevice | null = null;
    try {
      device = await this.userAuthDevicesService.claimPreValidated({
        email,
        user_id: user.id,
        user_agent: this.requestService.user_agent || '-',
        ip_address: this.requestService.ip_address || '-',
      });
      if (!device) return null;

      const validatedUser = await this.userService.updateById(user.id, {
        email_validated: true,
        twofa_code: null,
        twofa_expires_at: null,
        twofa_attempts: 0,
      });
      this.audit('info', 'register', 'Register 2FA skipped: wait-list validated device', undefined, user.id);
      return await this.handleLogin(validatedUser, 'pre_validated_device', device);
    } catch (error) {
      // The account exists either way; a failure here must not lose it, only cost a 2FA code.
      this.audit('error', 'register', 'Failed to log in with the wait-list validated device', {
        error_message: error instanceof Error ? error.message : String(error),
      }, user.id);
      // A claimed device is already trusted, so the 2FA fallback would skip sending the code and
      // strand the user on the 2FA page. Untrust it so the fallback really sends one.
      if (device) {
        await this.userAuthDevicesService
          .update(device.id, { disabled: true })
          .catch(() => undefined);
      }
      return null;
    }
  }
  async login(authLoginRequest: LoginRequest): Promise<UserAuth | UserTwofa> {
    const user = await this.userService.findOneByWithSecrets(
      'email',
      authLoginRequest.email,
    );
    if (!user) {
      // No user id: the email is someone's PII, and there is no account to pivot on.
      this.audit('warn', 'login', 'Login rejected', { reason: 'unknown_account' });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.banned) {
      this.audit('warn', 'login', 'Login rejected', { reason: 'banned' }, user.id);
      throw new UnauthorizedException(user.banned_reason || 'Account permanentely banned')
    }

    // OAuth-only accounts have no password (bcrypt throws on a null hash): plain bad credentials.
    const isPasswordValid =
      !!user.password && (await compare(authLoginRequest.password, user.password));
    if (!isPasswordValid) {
      this.audit('warn', 'login', 'Login rejected', { reason: 'bad_password' }, user.id);
      throw new UnauthorizedException('Invalid credentials');
    }
    // Logging in again (e.g. after closing the 2FA tab to fetch the code) must not invalidate the
    // code already in the inbox, so a pending one is reused; only an explicit resend replaces it.
    const reusePendingCode = this.hasReusableCode(user);
    delete user.password;
    delete user.twofa_code;
    delete user.twofa_attempts;
    const result = await this.handle2fa(
      user,
      {
        user_agent: this.requestService?.user_agent || '-',
        ip_address: this.requestService?.ip_address || '-',
      },
      { reusePendingCode, reason: 'login' },
    );
    if (result.need_2fa) {
      this.audit('info', 'login', 'Login requires 2FA', { code_reused: reusePendingCode }, user.id);
      return { ...result.user, token: null, need_twofa: true };
    }
    return await this.handleLogin(user, 'password', result.user_auth_device);
  }
  /**
   * Serialized per account: the attempt counter is read, compared and written back, so parallel
   * guesses all read the same count and the limit never tripped. Under the lock each guess sees
   * the previous one's increment (and a valid code can only be redeemed once).
   */
  async verify2fa(verify2faRequest: Verify2faRequest) {
    return withUserLock(
      `twofa:${String(verify2faRequest.email).trim().toLowerCase()}`,
      TWOFA_LOCK_TTL_MS,
      () => this.verify2faLocked(verify2faRequest),
      { waitMs: TWOFA_LOCK_WAIT_MS },
    );
  }

  private async verify2faLocked(verify2faRequest: Verify2faRequest) {
    const user = await this.userService.findOneByWithSecrets(
      'email',
      verify2faRequest.email,
    );
    if (!user) {
      this.audit('warn', 'twofa', 'Login rejected', { reason: 'unknown_account' });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.banned) {
      this.audit('warn', 'twofa', 'Login rejected', { reason: 'banned' }, user.id);
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

      await this.userService.updateById(
        user.id,
        attempts >= maxAttempts
          ? { twofa_attempts: 0, twofa_code: null, twofa_expires_at: null }
          : { twofa_attempts: attempts },
      );
      this.audit('warn', 'twofa', '2FA verification failed', {
        attempts,
        max_attempts: maxAttempts,
        code_burned: attempts >= maxAttempts,
      }, user.id);

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
      this.audit('warn', 'twofa', 'Login rejected', { reason: 'device_blocked' }, user.id);
      throw new ForbiddenException('Device is blocked');
    }

    const [_, updatedUser] = await Promise.all([
      this.userAuthDevicesService.update(userAuthDevice.id, {
        disabled: false,
      }),
      this.userService.updateById(user.id, {
        twofa_code: null,
        twofa_expires_at: null,
        twofa_attempts: 0,
        email_validated: true,
      }),
    ]);

    return await this.handleLogin(updatedUser, 'twofa', userAuthDevice);
  }
  async refreshToken() {
    const user = this.requestService.user;
    if (!user) {
      this.audit('warn', 'refresh', 'Session refresh rejected', { reason: 'no_user' });
      throw new UnauthorizedException('Invalid credentials');
    }
    const authDevice = await this.userAuthDevicesService.getOneByAuthDevice({
      user_id: user.id,
      user_agent: this.requestService.user_agent || '-',
      ip_address: this.requestService.ip_address || '-',
    });
    if (!authDevice || authDevice.disabled || authDevice.blocked_at) {
      this.audit('warn', 'refresh', 'Session refresh rejected', { reason: 'device_untrusted' }, user.id);
      throw new UnauthorizedException('Invalid credentials');
    }
    const exists = await this.userSessionsService.sessionExists({
      user_id: user.id,
      user_auth_device_id: authDevice.id,
      token: user.token,
    });
    if (!exists) {
      this.audit('warn', 'refresh', 'Session refresh rejected', { reason: 'session_missing' }, user.id);
      throw new UnauthorizedException('Invalid credentials');
    }
    // Re-sign from the database, not from the old token: the payload is a snapshot taken at sign-in,
    // so copying it forward kept values such as `funnel_step` and `stripe_customer_id` stale forever.
    const freshUser = await this.userService.findOneBy('id', user.id);
    if (freshUser.banned) {
      this.audit('warn', 'refresh', 'Session refresh rejected', { reason: 'banned' }, user.id);
      throw new UnauthorizedException(freshUser.banned_reason || 'Account permanently banned');
    }
    return await this.handleLogin(freshUser, 'refresh', authDevice);
  }
  async passwordRecovery({ email }: PasswordRecoveryRequest) {
    // Built server-side, never taken from the request. When this came from the client
    // an attacker could pass their own URL and the victim would receive a genuine,
    // correctly-branded recovery email whose button carried the valid `code` to the
    // attacker's site — a one-click account takeover.
    const fallback_url = `${this.configService.get<string>('app.url')}/auth/password-recovery/recover`;
    const user = await this.userService.findOneBy('email', email);
    if (!user) {
      // Never the email that was asked for.
      this.audit('warn', 'password-recovery', 'Password recovery rejected', { reason: 'unknown_account' });
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

    const name = await this.greetingName(user.id);
    this.mailService
      .send(this.passwordRecoveryMail.setData({ email: user.email, name }, passwordRecoveryAttempt, user.language))
      .catch((error: Error) =>
        // SMTP rejects quote the recipient (`550 <a@b.c> rejected`); the stack repeats it.
        this.audit('error', 'password-recovery', 'Failed to send password recovery email', {
          error_name: error?.name,
          error_message: maskEmailAddresses(error?.message ?? ''),
        }, user.id),
      );
    this.audit('info', 'password-recovery', 'Password recovery requested', undefined, user.id);
    // Never return the attempt itself: it carries `code`, and handing that to the
    // requester let anyone who knew an email reset that account's password. Only the
    // timing the client needs for its cooldown/expiry UI leaves the API.
    return {
      code_validated: passwordRecoveryAttempt.code_validated,
      expires_at: passwordRecoveryAttempt.expires_at,
      updated_at: passwordRecoveryAttempt.updated_at,
    };
  }
  async checkPasswordRecoveryAttempt(
    checkPasswordRecoveryAttemptRequest: CheckPasswordRecoveryAttemptRequest,
  ) {
    const passwordRecoveryAttempt =
      await this.passwordRecoveryAttemptsService.findOneByCode(
        checkPasswordRecoveryAttemptRequest.code,
      );
    const recoveryUserId = passwordRecoveryAttempt?.user?.id;
    if (!passwordRecoveryAttempt) {
      this.audit('warn', 'password-recovery', 'Password recovery rejected', { reason: 'invalid_code' });
      throw new BadRequestException('Invalid code');
    }
    if (passwordRecoveryAttempt.expires_at.getTime() < new Date().getTime()) {
      this.audit('warn', 'password-recovery', 'Password recovery rejected', { reason: 'expired' }, recoveryUserId);
      throw new BadRequestException('Code expired');
    }
    await this.passwordRecoveryAttemptsService.update(
      passwordRecoveryAttempt.id,
      {
        code_validated: true,
      },
    );
    this.audit('info', 'password-recovery', 'Password recovery code validated', undefined, recoveryUserId);
    return passwordRecoveryAttempt;
  }
  async updatePassword(updatePasswordRequest: UpdatePasswordRequest) {
    const passwordRecoveryAttempt =
      await this.passwordRecoveryAttemptsService.findOneByCode(
        updatePasswordRequest.code,
      );
    if (!passwordRecoveryAttempt) {
      this.audit('warn', 'password-recovery', 'Password recovery rejected', { reason: 'invalid_code' });
      throw new BadRequestException('Invalid password recovery attempt');
    }
    const recoveryUserId = passwordRecoveryAttempt.user?.id;
    if (!passwordRecoveryAttempt.code_validated) {
      this.audit('warn', 'password-recovery', 'Password recovery rejected', { reason: 'not_validated' }, recoveryUserId);
      throw new BadRequestException('Code not validated');
    }
    if (compareAsc(passwordRecoveryAttempt.expires_at, new Date()) === -1) {
      this.audit('warn', 'password-recovery', 'Password recovery rejected', { reason: 'expired' }, recoveryUserId);
      throw new BadRequestException('Code expired');
    }

    const [updatedUser] = await Promise.all([
      this.userService.updateById(passwordRecoveryAttempt.user.id, {
        password: await hash(updatePasswordRequest.password),
      }),
      this.passwordRecoveryAttemptsService.update(passwordRecoveryAttempt.id, {
        expires_at: new Date(),
      }),
      // A reset is how a user evicts whoever else got in: every existing session goes.
      this.userSessionsService.expireAllForUser(passwordRecoveryAttempt.user.id),
    ]);
    this.audit('info', 'password-recovery', 'Password reset completed', { sessions_revoked: 'all' }, recoveryUserId);

    return updatedUser;
  }
  private async handleLogin(
    user: BaseUser,
    method: 'password' | 'twofa' | 'pre_validated_device' | 'refresh' | & OauthProviders,
    userAuthDevice?: UserAuthDevice,
  ) {
    const payload: UserPayload = {
      ...user,
      user_auth_device_id: userAuthDevice?.id,
    };
    if (!user.email_validated) {
      this.audit('warn', 'login', 'Login rejected', { reason: 'email_not_validated' }, user.id);
      throw new UnauthorizedException('Email not validated');
    }
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: `${USER_SESSION_TTL_DAYS}d`,
      secret: this.configService.get('jwt.secret'),
    });
    if (userAuthDevice) {
      await this.userSessionsService.handleSessionProcess({
        user_id: user.id,
        user_auth_device_id: userAuthDevice.id,
        token,
        expires_at: addDays(new Date(), USER_SESSION_TTL_DAYS),
      });
    }
    // Refresh is the hot path (every page load near expiry): no line for it.
    if (method !== 'refresh') {
      this.audit('info', 'login', 'Login succeeded', {
        method,
        user_auth_device_id: userAuthDevice?.id,
        trusted_device: userAuthDevice ? !userAuthDevice.disabled : false,
      }, user.id);
    }
    return { ...user, token };
  }

  /**
   * Emails a new 2FA code on request, replacing the pending one. Only our Next.js server may call
   * it (AppTokenGuard), and it takes the email from the encrypted 2FA cookie that only a correct
   * password or a fresh registration sets — so it cannot be used to mail codes to arbitrary users.
   */
  async resend2fa({ email }: Resend2faRequest): Promise<UserTwofa> {
    const user = await this.userService.findOneByWithSecrets('email', email);
    if (!user || user.banned) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.twofa_code && user.twofa_expires_at) {
      const issuedAt = subMinutes(user.twofa_expires_at, TWOFA_CODE_TTL_MINUTES);
      const waitSeconds = TWOFA_RESEND_COOLDOWN_SECONDS - differenceInSeconds(new Date(), issuedAt);
      if (waitSeconds > 0) {
        throw new BadRequestException(`Please wait ${waitSeconds} seconds before asking for a new code`);
      }
    }
    const updatedUser = await this.issue2faCode(user, 'resend');
    return { ...updatedUser, token: null, need_twofa: true };
  }

  /** True when the user has an unexpired 2FA code with enough life left to be worth typing. */
  private hasReusableCode(user: BaseUserWithSecrets) {
    if (!user.twofa_code || !user.twofa_expires_at) return false;
    return differenceInSeconds(user.twofa_expires_at, new Date()) >= TWOFA_MIN_REUSE_SECONDS;
  }

  /**
   * The profile name auth mails greet by; the core user lacks it. `null` (the nameless greeting)
   * until onboarding's Name step sets it, and also when the read fails: a greeting must never stop
   * a login code or a recovery link from going out.
   */
  private async greetingName(userId: number): Promise<string | null> {
    try {
      const { name } = await this.userService.findOneCompacted(userId);
      return name ?? null;
    } catch {
      return null;
    }
  }

  /** Stores a fresh hashed code (resetting the attempt budget) and emails the plain one. */
  private async issue2faCode(user: BaseUser, reason: 'login' | 'register' | 'resend') {
    // Digits only: easier to read off a phone and to type, and mobile keyboards show a number pad.
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const updatedUser = await this.userService.updateById(user.id, {
      twofa_code: await hash(code),
      twofa_expires_at: addMinutes(new Date(), TWOFA_CODE_TTL_MINUTES),
      twofa_attempts: 0,
    });
    const name = await this.greetingName(updatedUser.id);
    this.mailService
      .send(this.twoFAMail.setUser({ email: updatedUser.email, name, twofa_code: code }, updatedUser.language))
      .catch((error: Error) =>
        this.audit('error', 'twofa', 'Failed to send 2FA email', {
          error_name: error?.name,
          error_message: maskEmailAddresses(error?.message ?? ''),
        }, updatedUser.id),
      );
    // Never the code.
    this.audit('info', 'twofa', '2FA code issued', { reason }, updatedUser.id);
    return updatedUser;
  }

  /**
   * Invitation and wait-list gate shared by every sign-up path, run before the account exists.
   * Order matters and is kept: validate the code, check the wait-list entry it came from, keep a
   * validated wait-list email reserved for its owner, then claim one use of the link atomically.
   * While registration is closed, only a valid invitation code gets through.
   */
  private async resolveInvitationCodeBeforeRegister(
    invitationCode: string | null | undefined,
    userEmail: string,
  ) {
    let invitationLink: InvitationLink | null = null;
    let waitList: WaitList | null = null;

    if (!invitationCode && config().app.registrationIsClosed) {
      throw new ApiException(API_ERRORS.REGISTRATION_CLOSED, 'Registration is closed', HttpStatus.FORBIDDEN);
    }

    if (invitationCode) {
      invitationLink = await this.invitationLinkService.validateCode(invitationCode);
      if (!invitationLink && config().app.registrationIsClosed) {
        throw new ApiException(API_ERRORS.REGISTRATION_CLOSED, 'Registration is closed', HttpStatus.FORBIDDEN);
      }
      if (invitationLink) {
        // An addressed invitation belongs to that inbox: without this, anyone holding the link
        // redeems it (and its benefit) under any email, closed registration included.
        if (
          invitationLink.email &&
          invitationLink.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()
        ) {
          this.rejectRegistration('invitation_email_mismatch', invitationLink.id);
          throw new ApiException(
            API_ERRORS.REGISTRATION_INVITATION_EMAIL_MISMATCH,
            'This invitation was sent to a different email address',
          );
        }
        waitList = await this.waitListService.findByInvitationLinkId(invitationLink.id);
        if (waitList && waitList.email.toLowerCase() !== userEmail.toLowerCase()) {
          this.rejectRegistration('invitation_email_mismatch', invitationLink.id);
          throw new ApiException(
            API_ERRORS.REGISTRATION_INVITATION_EMAIL_MISMATCH,
            'We detected this invitation comes from a wait list, so you must register with the same email address',
          );
        }
        // The invite window lives on the wait-list entry; links created before they carried
        // their own expiry would otherwise redeem (and claim the tier's benefit) forever.
        if (
          waitList &&
          (waitList.status !== 'INVITED' ||
            (waitList.expires_at && new Date(waitList.expires_at).getTime() <= Date.now()))
        ) {
          this.rejectRegistration('invitation_expired', invitationLink.id);
          throw new ApiException(API_ERRORS.REGISTRATION_INVITATION_EXPIRED, 'This invitation has expired');
        }
      }
    }
    if (!waitList) {
      //Prevent register with reserved email from wait list
      const existingWaitListEntry = await this.waitListService.findByEmail(userEmail);
      if (existingWaitListEntry?.validated_at) {
        const isExpired = existingWaitListEntry.expires_at
          ? existingWaitListEntry.expires_at.getTime() <= new Date().getTime()
          : false;

        if (!isExpired) {
          this.rejectRegistration('email_reserved');
          throw new ApiException(API_ERRORS.REGISTRATION_EMAIL_RESERVED, 'Email already in use');
        }
      }
    }
    // Claimed before the account exists, atomically: `validateCode` above is only a read, and
    // concurrent registrations used to all pass it and each write back `current_uses + 1`.
    if (invitationLink && !(await this.invitationLinkService.claimUse(invitationLink.id))) {
      this.rejectRegistration('invitation_used', invitationLink.id);
      throw new ApiException(API_ERRORS.REGISTRATION_INVITATION_USED, 'This invitation has already been used');
    }

    return { invitationLink, waitList };
  }

  /**
   * Creates the account once `resolveInvitationCodeBeforeRegister` let it through, then redeems
   * the wait-list entry and grants the invitation's benefit. `overrides` win over the defaults;
   * without a `username` one is generated from the name, surname or role and flagged
   * `username_auto_generated`: the first rename of it is free (`UserService.updateUnlocked`).
   *
   * Errors depend on whether the account exists yet:
   * - Before the row is created, nothing persisted: the claimed invitation use is handed back
   *   and the error is rethrown (a concurrent duplicate becomes a 409, anything unknown a 500).
   * - After it, the account is real and is returned: failing the request would leave the user
   *   with an account they were told does not exist. A missed wait-list redeem or benefit grant
   *   is a broken invariant, logged `critical` for an admin to fix by hand.
   */
  private async finishCreateUserAccount(
    // `email_validated` is required: each caller states whether the email is proven, no default.
    { username, ...overrides }: Partial<CreateUserInput> &
      Pick<CreateUserInput, 'email'> & { email_validated: boolean },
    {
      invitationLink = null,
      waitList = null,
      role = 'ARTIST',
      method = 'password',
    }: {
      invitationLink?: InvitationLink | null;
      waitList?: WaitList | null;
      role?: EnumType<'USER_ROLE'>;
      /** `password` or the OAuth provider, for the logs. */
      method?: string;
    } = {},
  ) {
    const benefit_id = invitationLink ? invitationLink.benefit_id : null;
    const context = {
      method,
      role,
      via_invitation: !!invitationLink,
      via_wait_list: !!waitList,
      ...(invitationLink ? { invitation_link_id: invitationLink.id } : {}),
      ...(waitList ? { wait_list_id: waitList.id } : {}),
      ...(benefit_id ? { benefit_id } : {}),
    };
    const fields = { operation: 'register' };
    this.logService.info('Account creation started', { ...context, ...fields });

    let step = 'role';
    let user: BaseUser;
    try {
      const clientRole = await this.roleService.getByName(role);
      step = 'username';
      // Inside the try so the claimed invitation use is released below.
      if (username && isReservedUsername(username)) throw ApiException.usernameReserved();
      // Only a name that survives the username folding counts: `Иван` or a blank name would give
      // a meaningless `user…`, so the role prefix is used and the Name step may still replace it.
      const namePrefix = [overrides.name, overrides.surname].find((part) => UserService.usernameBase(part));
      const finalUsername =
        username || (await this.userService.generateUniqueUsername(namePrefix ?? role));
      step = 'create-user';
      user = await this.userService.create({
        public_id: await generateUUID(),
        //First step is for asking user to update its username
        funnel_step:!username? 1: 2,
        username: finalUsername,
        username_auto_generated: !username,
        username_reset_count: 0,
        password_reset_count: 0,
        benefit_id,
        invitation_link_id: invitationLink ? invitationLink.id : null,
        role_id: clientRole.id,
        language: this.requestService.language ?? DEFAULT_LANGUAGE,
        ...overrides,
      });
    } catch (error) {
      await this.releaseInvitationUse(invitationLink, step);
      throw this.accountCreationError(error, step, context);
    }

    this.logService.info('User row created', { user_id: user.id, ...context, step: 'create-user', ...fields });

    // The account exists from here on: these steps never undo it nor fail the sign-up.
    if (waitList) {
      try {
        await this.waitListService.updateById(waitList.id, {
          status: 'REGISTERED',
          redeemed_at: new Date(),
        });
        this.logService.info('Wait-list entry redeemed', { user_id: user.id, step: 'wait-list', wait_list_id: waitList.id, ...fields });
      } catch (error) {
        // Left `INVITED`: the entry still looks open and still holds its email.
        this.logService.critical(
          'Account created but wait-list entry not redeemed',
          { user_id: user.id, ...context, step: 'wait-list', ...this.errorInfo(error), ...fields },
        );
      }
    }
    if (benefit_id) {
      try {
        await this.userBenefitService.create(user.id, benefit_id);
        this.logService.info('Benefit granted', { user_id: user.id, step: 'benefit', benefit_id, ...fields });
      } catch (error) {
        // `users.benefit_id` is set but no `user_benefits` row: the user does not get it.
        this.logService.critical(
          'Account created but invitation benefit not granted',
          { user_id: user.id, ...context, step: 'benefit', ...this.errorInfo(error), ...fields },
        );
      }
    }

    this.logService.success('User account created', { user_id: user.id, ...context, ...fields });
    return user;
  }

  /** Hands back the invitation use claimed before a creation that failed. Never throws. */
  private async releaseInvitationUse(invitationLink: InvitationLink | null, step: string) {
    if (!invitationLink) return;
    try {
      await this.invitationLinkService.releaseUse(invitationLink.id);
      this.logService.info(
        'Invitation use released',
        { step, invitation_link_id: invitationLink.id, operation: 'register' },
      );
    } catch (error) {
      // Swallowed so the creation error stays the one thrown; the link is now one use short.
      this.logService.critical(
        'Invitation use not released after failed account creation',
        { step, invitation_link_id: invitationLink.id, ...this.errorInfo(error), operation: 'register' },
      );
    }
  }

  /** Logs a pre-creation failure at the level it deserves and returns the error to throw. */
  private accountCreationError(error: unknown, step: string, context: Record<string, unknown>) {
    const failure = { ...context, step, ...this.errorInfo(error) };
    const fields = { operation: 'register' };

    // Two sign-ups raced past the request validation with the same email or username.
    if (error instanceof DbUniqueViolationException) {
      this.logService.critical('Account creation failed', { ...failure, reason: 'duplicate', ...fields });
      return new ConflictException('Email or username is already in use');
    }
    // No such role: every sign-up fails until it is seeded back. Not the client's fault.
    if (step === 'role') {
      this.logService.critical('Account creation failed unexpectedly', { ...failure, ...fields });
      return new InternalServerErrorException('Something went wrong creating your account');
    }
    // The caller asked for a reserved name: the client's fault, and the exception filter already
    // writes its 4xx `warn`. Not an admin alert.
    if (error instanceof ApiException && error.API_ERROR_CODE === API_ERRORS.USERNAME_RESERVED) {
      return error;
    }
    // A known failure (e.g. no free username after the retries): already shaped for the client.
    if (error instanceof HttpException && error.getStatus() < 500) {
      this.logService.critical('Account creation failed', { ...failure, ...fields });
      return error;
    }
    this.logService.critical('Account creation failed unexpectedly', { ...failure, ...fields });
    return new InternalServerErrorException('Something went wrong creating your account');
  }

  /** The OAuth `error` field of a provider token response (RFC 6749 §5.2), when there is one. */
  private providerErrorCode(error: unknown): string | undefined {
    const code = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    return typeof code === 'string' && /^[a-z_]{1,64}$/.test(code) ? code : undefined;
  }

  /** Error name and a masked, truncated message: DB errors can quote the email they rejected. */
  private errorInfo(error: unknown) {
    return {
      error_name: error instanceof Error ? error.name : typeof error,
      error_message: maskEmailAddresses(error instanceof Error ? error.message : String(error)).slice(0, 200),
    };
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
    {
      reusePendingCode = false,
      reason = 'login',
    }: { reusePendingCode?: boolean; reason?: 'login' | 'register' } = {},
  ): Promise<TwoFactorAuth> {
    const userDevice = await this.userAuthDevicesService.getOneOrCreate({
      user_id: user.id,
      user_agent: user_agent || this.requestService?.user_agent || '-',
      ip_address: ip_address || this.requestService?.ip_address || '-',
      disabled: true,
      blocked_at: null,
    });
    if (userDevice.blocked_at) {
      this.audit('warn', reason, 'Login rejected', { reason: 'device_blocked' }, user.id);
      throw new ForbiddenException('Device is blocked');
    }
    if (!user.twofa_enabled || !userDevice.disabled) {
      return { user_auth_device: userDevice, user, need_2fa: false };
    }

    // The pending code (and its expiry, already on `user`) stays valid: no new email.
    if (reusePendingCode) {
      return { user_auth_device: userDevice, user, need_2fa: true };
    }
    return {
      user_auth_device: userDevice,
      user: await this.issue2faCode(user, reason),
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
    this.audit('info', 'logout', 'Logged out', { session_id: session.id }, user.id);
    return true;
  }


  async oauth2Initiate({ redirect_uri, provider, state, code_challenge }: GoogleAuthInitiate): Promise<string> {

    switch (provider) {
      case 'google':
        return this.googleOauth2Service.getRedirectUrl({
          scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
          redirectUri: redirect_uri,
          state,
          codeChallenge: code_challenge,
        });
    }
  }


  async handleOauth2Callback({ provider, code, redirect_uri, code_verifier, invitation_code }: OauthCallback): Promise<OauthCallbackResponse> {


    let userInfo: {
      email: string,
      providerUserId: string,
      name?: string,
      lastName?: string
      avatar?: string,
      refreshToken?: string,
      scopes: string[]
    } | null = null;

    switch (provider) {

      case 'google':

        // A bad, replayed or expired code, a wrong PKCE verifier or a Google outage. Mostly
        // caller-caused on a public endpoint: a 401 and a warn, never a 5xx that alerts.
        const { profile, refreshToken, scopes } = await this.googleOauth2Service
          .getUserInfo(code, redirect_uri, code_verifier)
          .catch((error: unknown) => {
            this.audit('warn', 'login', 'Login rejected', {
              reason: 'provider_exchange_failed',
              method: provider,
              error_name: error instanceof Error ? error.name : typeof error,
              // Google's OAuth code (`invalid_grant`, `invalid_client`, `redirect_uri_mismatch`…):
              // tells a junk code from a broken setup. A fixed enum, never a secret.
              provider_error: this.providerErrorCode(error),
            });
            throw new UnauthorizedException('oauth_exchange_failed');
          });
        if (!profile.verified_email || !profile.email || !profile.id) {
          this.audit('warn', 'login', 'Login rejected', { reason: 'provider_email_unverified', method: provider });
          throw new HttpException(`Something went wrong with your ${provider} account, try other method`, 422);
        }

        userInfo = {
          // Same normalization as password sign-up, which lowercases: one account per address.
          email: profile.email.trim().toLowerCase(),
          providerUserId: profile.id,
          avatar: profile.picture,
          name: profile.given_name,
          lastName: profile.family_name,
          refreshToken: refreshToken,
          scopes,
        }

    }

    if (!userInfo) {
      throw new HttpException(`Something went wrong with your ${provider} account, try other method`, 422);
    }




    let linkedUser: BaseUser | null = null;
    let alreadyExist = true;
    // Already linked: the provider account's stable id decides the user, not the email.
    const linkedAccount = await this.userOauthProvidersService.findByProviderUserId(
      provider,
      userInfo.providerUserId,
    );
    if (linkedAccount) {
      // The FK cascades on user delete, so a linked row always has a user (findOneBy 404s otherwise).
      linkedUser = await this.userService.findOneBy('id', linkedAccount.user_id);
    } else {
      // `findOneBy` throws 404 when nobody has this email: that is the sign-up case, not an error.
      linkedUser = await this.userService.findOneBy('email', userInfo.email).catch((error: unknown) => {
        if (error instanceof HttpException && error.getStatus() === 404) return null;
        throw error;
      });
    }

    // A linked provider account is trusted as is; an email match only when that email was proven.
    // `email_validated` is not rewritten: the user may have changed email since linking.
    const trusted = !!linkedAccount || !!linkedUser?.email_validated;

    // Before sign-up: an untrusted banned account would otherwise be deleted (ban included) and
    // recreated clean under the same email.
    if (linkedUser?.banned) {
      this.audit('warn', 'login', 'Login rejected', { reason: 'banned', method: provider, trusted }, linkedUser.id);
      // The reason belongs to the account's owner; untrusted, that may not be whoever proved the email.
      throw new UnauthorizedException(
        (trusted && linkedUser.banned_reason) || 'Account permanently banned',
      );
    }
    if (linkedUser && trusted) {
      this.audit('info', 'login', 'OAuth account matched', {
        method: provider,
        match: linkedAccount ? 'linked' : 'email',
      }, linkedUser.id);
    }

    //REGISTER

    if (!trusted) {

      // The gate runs first: a rejected sign-up must not have deleted anything.
      const { invitationLink, waitList } = await this.resolveInvitationCodeBeforeRegister(invitation_code, userInfo.email);

      // Delete a suspicious unvalidated account holding the email the provider just verified. The
      // invitation use is already claimed, so a failed delete hands it back like a failed create.
      if (linkedUser) {
        // Someone registered this address without proving it; the provider just did.
        await this.userService.deleteAccount(linkedUser.id, true).catch(async (error: unknown) => {
          await this.releaseInvitationUse(invitationLink, 'delete-unvalidated');
          throw error;
        });
        this.audit('warn', 'register', 'Unvalidated account replaced', { method: provider }, linkedUser.id);
      }

      linkedUser = await this.finishCreateUserAccount(
        {
          // The provider verified the email (checked above).
          email_validated: true,
          email: userInfo.email,
          name: userInfo.name,
          surname: userInfo.lastName,
        },
        { invitationLink, waitList, role: 'ARTIST', method: provider },
      );

      this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(linkedUser));
      alreadyExist = false;

    }
    // Can't happen: a linked account 404s above when its user is gone, and sign-up assigns the new
    // user. Reaching it means one of those calls changed contract, so an admin must look.
    if (!linkedUser) {
      this.logService.critical(
        'OAuth callback resolved no user',
        {
          ...(linkedAccount ? { user_id: linkedAccount.user_id } : {}),
          method: provider,
          linked_account: !!linkedAccount,
          trusted,
          signed_up: !alreadyExist,
          operation: alreadyExist ? 'login' : 'register',
        },
      );
      throw new InternalServerErrorException(`Could not sign you in with ${provider}, try another method`);
    }

    // `handleLogin` rejects this too, but only after the device was trusted and the provider
    // linked: a linked account whose current email is unproven (changed since) stops here first.
    if (!linkedUser.email_validated) {
      this.audit('warn', 'login', 'Login rejected', { reason: 'email_not_validated', method: provider }, linkedUser.id);
      throw new UnauthorizedException('Email not validated');
    }

    // Same device handling as a completed 2FA: the token needs a device id and a session row.
    const userAuthDevice = await this.userAuthDevicesService.getOneOrCreate({
      user_id: linkedUser.id,
      user_agent: this.requestService?.user_agent || '-',
      ip_address: this.requestService?.ip_address || '-',
      disabled: false,
      blocked_at: null,
    });
    if (userAuthDevice.blocked_at) {
      this.audit('warn', 'login', 'Login rejected', { reason: 'device_blocked', method: provider }, linkedUser.id);
      throw new ForbiddenException('Device is blocked');
    }
    if (userAuthDevice.disabled) {
      await this.userAuthDevicesService.update(userAuthDevice.id, { disabled: false });
    }

    await this.userOauthProvidersService.upsert({
      email: userInfo.email,
      provider,
      provider_user_id: userInfo.providerUserId,
      refresh_token: userInfo?.refreshToken,
      scopes: userInfo.scopes,
      user_id: linkedUser.id
    })
    const auth = await this.handleLogin(linkedUser, provider, { ...userAuthDevice, disabled: false });

    // First time this provider is connected (sign-up or linking by email): take its picture when the
    // account has none. Not awaited (download + moderation take seconds), and it never throws.
    const avatarUrl = !linkedAccount ? this.providerAvatarUrl(provider, userInfo.avatar) : null;
    if (avatarUrl) {
      void this.userService.importProviderAvatar({
        user: { id: linkedUser.id, public_id: linkedUser.public_id },
        url: avatarUrl,
        provider,
        nameParts: [userInfo.name, userInfo.lastName],
      });
    }

    return { auth, alreadyExist };
  }

  /**
   * The provider's picture URL when it is https on one of that provider's image hosts, else `null`.
   * The URL arrives from the provider's API, but the server is about to fetch it: pin the host so
   * a changed or spoofed value can't point the request at anything internal.
   */
  private providerAvatarUrl(provider: OauthCallback['provider'], picture?: string | null): string | null {
    if (!picture) return null;
    let url: URL;
    try {
      url = new URL(picture);
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    switch (provider) {
      case 'google':
        if (!url.hostname.endsWith('.googleusercontent.com')) return null;
        // Google serves 96px by default (`…=s96-c`); ask for 512px, cropped square as before.
        url.pathname = url.pathname.replace(/=s\d+(-c)?$/, '=s512-c');
        return url.toString();
      default:
        return null;
    }
  }

}







//Oauth strategies


