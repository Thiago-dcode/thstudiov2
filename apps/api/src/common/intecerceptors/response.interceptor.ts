import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Audit, SuccessResponse } from '@repo/common-lib/types/response';
import { map } from 'rxjs';
import { RequestService } from '../services/request.service';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '../decorators/skip-response-transform.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly requestService: RequestService,
    private readonly reflector: Reflector,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler) {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      map((res) => {
        const endTime = Date.now();
        const audit: Audit = {
          user_agent: this.requestService?.user_agent || '-',
          ip: this.requestService?.ip_address || '-',
          request_time: (endTime - startTime) / 1000,
          language: this.requestService?.language || DEFAULT_LANGUAGE,
        };
        const response: SuccessResponse<typeof res> = {
          error: null,
          data: res,
          pagination: this.requestService.pagination || undefined,
          count: Array.isArray(res) ? res.length : undefined,
          audit,
        };
        return response;
      }),

    );
  }
}
