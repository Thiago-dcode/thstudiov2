import { Injectable } from '@nestjs/common';
import { LoginRequest } from './requests/login.request';


@Injectable()
export class AuthService {
  constructor() {}
  async login(authLoginDto: LoginRequest) {
    console.log(authLoginDto);
    return 'This action adds a new auth';
  }
 
}
