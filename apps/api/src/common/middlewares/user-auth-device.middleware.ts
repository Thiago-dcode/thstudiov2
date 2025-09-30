import { Injectable, NestMiddleware, Scope } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestService } from 'src/common/services/request.service';

@Injectable({ scope: Scope.REQUEST })
export class UserAuthDeviceMiddleware implements NestMiddleware {
  constructor(private readonly requestService: RequestService) {}

  async use(req: Request, _: Response, next: NextFunction) {
    this.requestService.user_agent = req.get('user-agent');
    this.requestService.ip_address = req.ip;
    next();
  }
}
