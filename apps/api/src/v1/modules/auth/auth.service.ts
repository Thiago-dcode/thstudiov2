import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginRequest } from './requests/login.request';
import { UserRepository } from '../users/users.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorAuth, UserAuth, UserPayload } from './auth.types';
import { ConfigService } from '@nestjs/config';
import { BaseUser } from '../users/users.types';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { randomStr } from '@repo/backend-lib/utils';
import { addMinutes } from 'date-fns/addMinutes';
import { UserAuthDevice } from '../user-auth-devices/user-auth-devices.types';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { addDays } from 'date-fns';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { TwoFAMail } from './mails/twofa-mail';
import { Verify2faRequest } from './requests/verify-2fa.request';
import { compareAsc } from 'date-fns/compareAsc';

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
  ) {}
  async login(authLoginRequest: LoginRequest): Promise<UserAuth | BaseUser> {
    const user = await this.verifyUser(authLoginRequest);
    const result = await this.handle2fa(user, {
      user_agent: authLoginRequest.user_agent,
      ip_address: authLoginRequest.ip_address,
    });
    return result.need_2fa
      ? result.user
      : await this.handleLogin(user, result.user_auth_device);
  }
  async verify2fa(verify2faRequest: Verify2faRequest) {
    const user = await this.verifyUser(verify2faRequest);
    if (
      user.twofa_code !== verify2faRequest.code ||
      compareAsc(user.twofa_expires_at, new Date()) === -1
    ) {
      throw new UnauthorizedException('Invalid verification code or expired');
    }
    //It should be created from the login process
    const userAuthDevice = await this.userAuthDevicesService.getOneOrCreate({
      user_id: user.id,
      user_agent: verify2faRequest.user_agent || this.requestService?.user_agent || '-',
      ip_address: verify2faRequest.ip_address || this.requestService?.ip_address || '-',
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
      this.userRepository.update(user.id, {
        twofa_code: null,
        twofa_expires_at: null,
        email_validated: true,
      }),
    ]);

    return await this.handleLogin(updatedUser, userAuthDevice);
  }
  private async handleLogin(user: BaseUser, userAuthDevice: UserAuthDevice) {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      user_auth_device_id: userAuthDevice.id,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('jwt.expiresIn'),
      secret: this.configService.get('jwt.secret'),
    });
    await this.userSessionsService.handleSessionProcess({
      user_id: user.id,
      user_auth_device_id: userAuthDevice.id,
      token,
      expires_at: addDays(new Date(), 1),
    });
    return { ...user, token };
  }
  private async verifyUser(authLoginRequest: LoginRequest): Promise<BaseUser> {
    const user = await this.userRepository.findOneByWithPassword(
      'email',
      authLoginRequest.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      authLoginRequest.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    delete user.password;
    return user;
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

    const code = randomStr(6);
    const expiresAt = addMinutes(new Date(), 10);
    const updatedUser = await this.userRepository.update(user.id, {
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
}
