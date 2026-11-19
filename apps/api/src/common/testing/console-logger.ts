import {
  ConsoleLogDriver,
  LogBuffer,
  LogConfig,
  LogEntry,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { emailCritical } from '@repo/backend-lib/config/logging';
import { apiLogConfig } from 'src/common/utils/api-logger';

/**
 * Specs only. A buffer that prints each line the moment it is logged (console.log/warn/error, one
 * JSON line each), so a spec can read what a logger wrote without a flush. Never in app code: the
 * process buffer is the only one there.
 */
export class ImmediateConsoleLogBuffer extends LogBuffer {
  constructor() {
    super(new ConsoleLogDriver());
  }

  add(entry: LogEntry): void {
    // The console driver prints synchronously, before its first await.
    this.track(this.write(entry));
  }

  async length(): Promise<number> {
    return 0;
  }

  async flush(): Promise<void> {}
}

/**
 * Specs only: an api logger (`apiLogConfig`: service, request/job trace id, request context)
 * printing its lines straight away. Never the critical mail (it would enqueue through Redis):
 * only a `config.callback` other than `emailCritical` runs.
 */
export function consoleLogger(config: Partial<LogConfig> = {}): LogService {
  const callback = config.callback === emailCritical ? undefined : config.callback;
  return new LogService({ ...apiLogConfig(config), callback }, new ImmediateConsoleLogBuffer());
}
