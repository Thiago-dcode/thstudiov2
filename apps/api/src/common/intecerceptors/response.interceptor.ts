import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Audit, SuccessResponse } from '@repo/common-lib/types/response';
import { map } from 'rxjs';
import { RequestService } from '../services/request.service';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly requestService: RequestService) {}
  intercept(_: ExecutionContext, next: CallHandler) {
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
