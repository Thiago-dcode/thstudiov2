import { Injectable, NestMiddleware, Scope } from '@nestjs/common';
import {
  IP_ADDRESS_HEADER,
  USER_AGENT_HEADER,
} from '@repo/common-lib/constants';
import { NextFunction, Request, Response } from 'express';
import { RequestService } from 'src/common/services/request.service';

@Injectable({ scope: Scope.REQUEST })
export class UserAuthDeviceMiddleware implements NestMiddleware {
  constructor(private readonly requestService: RequestService) {}

  async use(req: Request, _: Response, next: NextFunction) {
    this.requestService.user_agent =
      req.get(USER_AGENT_HEADER) || req.get('user-agent') || '-';
    this.requestService.ip_address =
      req.get(IP_ADDRESS_HEADER) || req.ip || req.get('x-forwarded-for') || '-';
    console.log("--User Auth Device Middleware--", {
      user_agent: this.requestService.user_agent,
      ip_address: this.requestService.ip_address,
    });
    next();
  }
}
