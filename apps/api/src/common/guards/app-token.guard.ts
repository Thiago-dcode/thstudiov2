import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_TOKEN_HEADER } from '@repo/common-lib/constants/headers';
import { Request } from 'express';

/**
 * Restricts a route to callers that present the shared private token (`app.token`) in the
 * {@link APP_TOKEN_HEADER} header. Used to keep otherwise-`@Public()` machine endpoints (e.g. the
 * sitemap feed) reachable only by our own Next.js app. Rejects with 403 when the token is missing,
 * mismatched, or not configured on the server.
 */
@Injectable()
export class AppTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Express lowercases header keys; APP_TOKEN_HEADER is already lowercase.
    const token = request.headers[APP_TOKEN_HEADER];
    const expected = this.configService.get<string>('app.token');

    if (!expected || token !== expected) {
      throw new ForbiddenException();
    }

    return true;
  }
}
