import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest } from './requests/login.request';
import { Public } from 'src/common/decorators/public.decorator';
import { Verify2faRequest } from './requests/verify-2fa.request';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('login')
  async login(@Body() authLoginDto: LoginRequest) {
    return await this.authService.login(authLoginDto);
  }

  @Public()
  @Post('verify-2fa')
  async verify2fa(@Body() verify2faDto: Verify2faRequest) {
    return await this.authService.verify2fa(verify2faDto);
  }
  @Post('logout')
  async logout() {
    return await this.authService.logout();
  }
  @Post('refresh-token')
  async refreshToken() {
    return await this.authService.refreshToken();
  }
}
