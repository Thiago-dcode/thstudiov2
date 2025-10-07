import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Audit, SuccessResponse } from '@repo/common-lib/types/response';
import { map } from 'rxjs';
import { RequestService } from '../services/request.service';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly requestService: RequestService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      map((res) => {
        const endTime = Date.now();
        const audit: Audit = {
          ip: request.ip,
          user_agent: request.get('user-agent'),
          request_time: (endTime - startTime) / 1000,
          language: this.requestService?.language,
          user: this.requestService?.user?.id,
        };
        const response: SuccessResponse<typeof res> = {
          error: null,
          data: res,
          audit,
        };
        return response;
      }),
    );
  }
}
