import { Injectable } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Injectable()
export class AuthService {
  login(authLoginDto: AuthLoginDto) {
    console.log(authLoginDto);
    return 'This action adds a new auth';
  }
  register(authRegisterDto: AuthRegisterDto) {
    console.log(authRegisterDto);
    return 'This action adds a new auth';
  }
}
