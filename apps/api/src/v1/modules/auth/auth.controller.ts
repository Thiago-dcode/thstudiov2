import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AppTokenGuard } from 'src/common/guards/app-token.guard';
import { Resend2faRequest } from './requests/resend-2fa.request';
import { AuthService } from './auth.service';
import { LoginRequest } from './requests/login.request';
import { Public } from 'src/common/decorators/public.decorator';
import { Verify2faRequest } from './requests/verify-2fa.request';
import { PasswordRecoveryRequest } from './requests/password-recovery.request';
import { UpdatePasswordRequest } from './requests/update-password.request';
import { Throttle } from '@nestjs/throttler';
import { CheckPasswordRecoveryAttemptRequest } from './requests/check-password-recovery.request';
import { RegisterRequest } from './requests/register.request';

@Throttle({ medium: { limit: 5, ttl: 10000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerRequest: RegisterRequest) {
    return await this.authService.register(registerRequest);
  }
  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() authLoginDto: LoginRequest) {
    return await this.authService.login(authLoginDto);
  }

  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('verify-2fa')
  async verify2fa(@Body() verify2faDto: Verify2faRequest) {
    return await this.authService.verify2fa(verify2faDto);
  }
  @Public()
  // Only our Next.js server may ask for a resend (it reads the email from the encrypted 2FA
  // cookie); the service also enforces a cooldown between codes.
  @UseGuards(AppTokenGuard)
  @Throttle({ medium: { limit: 3, ttl: 60000 } })
  @Post('resend-2fa')
  async resend2fa(@Body() resend2faDto: Resend2faRequest) {
    return await this.authService.resend2fa(resend2faDto);
  }
  @Post('logout')
  async logout() {
    return await this.authService.logout();
  }
  @Post('refresh-token')
  async refreshToken() {
    return await this.authService.refreshToken();
  }
  @Public()
  // Stricter than the controller default: password-recovery sends an email
  // and is already cooled-down server-side in AuthService, but should also
  // be rate-limited per-IP to slow down enumeration/spam.
  @Throttle({ medium: { limit: 3, ttl: 60000 } })
  @Post('password-recovery')
  async passwordRecovery(@Body() passwordRecoveryDto: PasswordRecoveryRequest) {
    return await this.authService.passwordRecovery(passwordRecoveryDto);
  }

  @Public()
  @Throttle({ medium: { limit: 8, ttl: 60000 } })
  @Post('validate-password-recovery-attempt')
  async checkPasswordRecoveryAttempt(
    @Body()
    checkPasswordRecoveryAttemptDto: CheckPasswordRecoveryAttemptRequest,
  ) {
    return await this.authService.checkPasswordRecoveryAttempt(
      checkPasswordRecoveryAttemptDto,
    );
  }
  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('update-password')
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordRequest) {
    return await this.authService.updatePassword(updatePasswordDto);
  }
}
