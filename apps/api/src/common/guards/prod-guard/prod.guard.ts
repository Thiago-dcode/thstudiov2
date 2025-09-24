import { CanActivate, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ProdGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.configService.get('app.env') != 'production';
  }
}
