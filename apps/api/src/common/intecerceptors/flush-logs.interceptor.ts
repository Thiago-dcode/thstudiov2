import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { finalize } from 'rxjs';
import { LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE } from '@repo/common-lib/constants/queues';

@Injectable()
export class FlushLogsInterceptor implements NestInterceptor {
  constructor(
    // Request-scoped APP_INTERCEPTOR resolves `LogService` from the route's
    // feature module, and most of those loggers are built without a Queue.
    @Inject(getQueueToken(LOG_QUEUE)) private readonly logQueue: Queue,
  ) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      finalize(() => {
        LogService.enqueueFlush(this.logQueue).catch((err) =>
          console.error('Failed to queue log flush:', err),
        );
      }),
    );
  }
}
