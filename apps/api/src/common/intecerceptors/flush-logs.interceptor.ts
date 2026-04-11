import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';
import { LogService } from '@repo/backend-lib/services/log-service';

@Injectable()
export class FlushLogsInterceptor implements NestInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        this.logService.flushAsync().catch((err) =>
          console.error('Failed to queue log flush:', err),
        );
      }),
    );
  }
}
