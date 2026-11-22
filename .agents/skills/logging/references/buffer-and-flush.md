# Log buffer and flush

Read when touching the buffer, flush, shutdown or deploy of logging.

- Every service (api, worker, web, dbcli) pushes lines to **one Redis list, `logs:pending`** (`RedisLogBuffer`, the process `logBuffer` in `@repo/backend-lib/config/logging`). The client is built on the first line (`lazyConnect`), never at import. A stored item is `{ logContext, entry }`; raw `logOptions` are never stored, only the redacted entry.
- **Only the worker writes to disk**: a repeatable `JOB_FLUSH_LOGS` job on `LOG_QUEUE`, every 5 s (`scheduleLogFlush`, `LOG_FLUSH_EVERY_MS`), calls `logBuffer.flush()` and writes `storage/logs/<service>/<date>.log`. Nothing else calls `flush()`: not a request, job, cron or process exit.
- **The list is capped** at 50,000 lines (`DEFAULT_LOG_REDIS_MAX_LENGTH`, ~50 MB). Redis is also the BullMQ broker (256 MB, `noeviction`), so past the cap the oldest lines are dropped (`LTRIM`) and stderr warns at most once a minute per process. Critical alerts are unaffected (the mail callback bypasses the buffer).
- Before `process.exit`, await `logBuffer.settle()` (bounded by `withTimeout`): it waits for in-flight pushes and callbacks (the critical mail) and never flushes.
- Redis down: a push falls back to writing directly through the file driver. No worker running: lines wait in Redis. Run the worker locally to see files.
- Under Jest (`NODE_ENV=test`) the process buffer is an `InMemoryLogBuffer`. A spec that needs Redis builds its own `RedisLogBuffer` over a fake.
- api, worker, web and the dbcli image ship in one deploy: the stored shape changed, and an old consumer drops new lines (and the reverse), reporting "not a log entry" on stderr.
