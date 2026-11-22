jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {} }));
const store = new Map<string, string>();
jest.mock('redis', () => ({
  createClient: () => ({
    on: jest.fn(),
    connect: jest.fn(async () => undefined),
    set: jest.fn(async (key: string, value: string, opts: { condition?: string }) => {
      if (opts.condition === 'NX' && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    }),
  }),
}));
jest.mock('@repo/common-lib/config/utils', () => ({ getConfigValue: () => ({ url: 'redis://test' }) }));

import fs from 'node:fs';
import path from 'node:path';
import { logBuffer } from '@repo/backend-lib/config/logging';
import type { LogEntry } from '@repo/backend-lib/config/logging';
import { InMemoryLogBuffer } from '@repo/backend-lib/services/log-service';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { apiLogger, apiTraceCarrier, RequestService } from 'src/common/services/request.service';
import { currentRequestId, requestStorage, runWithTraceId } from 'src/common/services/request-storage';
import { StripeService } from 'src/common/services/stripe.service';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';

const ROOT = path.resolve(__dirname, '../../../..');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '.turbo']);
const SELF = path.basename(__filename);

function walk(dir: string, accept: (file: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, accept, out);
    else if (accept(full)) out.push(full);
  }
  return out;
}

const isTestFile = (file: string) => /\.(spec|test)\.ts$/.test(file) || file.includes(`${path.sep}__tests__${path.sep}`);
const rel = (file: string) => path.relative(ROOT, file).split(path.sep).join('/');
const read = (file: string) => fs.readFileSync(file, 'utf8');

const sourceDirs = (): string[] => {
  const dirs: string[] = [];
  for (const group of ['apps', 'packages']) {
    for (const name of fs.readdirSync(path.join(ROOT, group))) {
      const src = path.join(ROOT, group, name, 'src');
      if (fs.existsSync(src)) dirs.push(src);
    }
  }
  return dirs;
};
const allSource = (accept: (f: string) => boolean = (f) => /\.(ts|tsx)$/.test(f)) =>
  sourceDirs().flatMap((d) => walk(d, accept)).filter((f) => path.basename(f) !== SELF);
const skillFiles = () => walk(path.join(ROOT, '.agents', 'skills'), (f) => f.endsWith('.md'));

/** Files whose text matches `pattern`, as repo-relative paths. */
const grep = (pattern: RegExp, files: string[]) => files.filter((f) => pattern.test(read(f))).map(rel);

/** The argument text of every `QueueHelper.<method>(...)` call in `text`, by balanced parentheses. */
function queueHelperCalls(text: string): string[] {
  const calls: string[] = [];
  const re = /QueueHelper\.(\w+)\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < text.length && depth > 0) {
      if (text[i] === '(') depth++;
      else if (text[i] === ')') depth--;
      i++;
    }
    calls.push(`${match[1]}${text.slice(re.lastIndex - 1, i)}`);
  }
  return calls;
}

describe('grep checks (AC-1, 3, 4, 14, 15, 16, 19, 26, 28)', () => {
  it('AC-1: no LogStorage|logStorage|LOG_STORAGE (other than the LOG_STORAGE_DIR env var) in source or skills', () => {
    const pattern = new RegExp('LogStorage|logStorage|LOG_STORAGE(?!_DIR)');
    expect(grep(pattern, [...allSource(), ...skillFiles()])).toEqual([]);
  });

  it('AC-3: no flushAsync|DEFAULT_LOG_JOB_OPTIONS|enqueueFlush|flushAndSettle anywhere in source or skills', () => {
    const pattern = new RegExp(['flush' + 'Async', 'DEFAULT_LOG_JOB_' + 'OPTIONS', 'enqueue' + 'Flush', 'flush' + 'AndSettle'].join('|'));
    expect(grep(pattern, [...allSource(), ...skillFiles()])).toEqual([]);
  });

  it('AC-4: in non-test source `.flush(` occurs only in the buffers and the worker job-runner', () => {
    const files = allSource((f) => /\.(ts|tsx)$/.test(f) && !isTestFile(f));
    const offenders = grep(/\.flush\(/, files).filter(
      (f) => !/^packages\/backend-lib\/src\/services\/log-service\/buffers\/[^/]+\.ts$/.test(f) && f !== 'apps/worker/src/job-runner.ts',
    );
    expect(offenders).toEqual([]);
    expect(read(path.join(ROOT, 'apps/worker/src/job-runner.ts'))).toMatch(/\[JOB_FLUSH_LOGS\]:\s*\(\)\s*=>\s*logBuffer\.flush\(\)/);
  });

  it('AC-14: LogProcessor and FlushLogsInterceptor are deleted and referenced nowhere; interceptors register only ResponseInterceptor', () => {
    expect(fs.existsSync(path.join(ROOT, 'apps/api/src/common/services/log.processor.ts'))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, 'apps/api/src/common/intecerceptors/flush-logs.interceptor.ts'))).toBe(false);
    expect(grep(/LogProcessor|FlushLogsInterceptor/, allSource())).toEqual([]);
    const providers = read(path.join(ROOT, 'apps/api/src/common/intecerceptors/interceptor.providers.ts'));
    expect(providers).toMatch(/INTERCEPTORS = \[ResponseInterceptor\]/);
  });

  it('AC-15: apps/api (non-spec) never mentions LOG_QUEUE, @Processor(LOG_QUEUE), registerQueue or getQueueToken for it', () => {
    const files = walk(path.join(ROOT, 'apps/api/src'), (f) => f.endsWith('.ts') && !isTestFile(f));
    expect(grep(/LOG_QUEUE/, files)).toEqual([]);
  });

  it("AC-16: no createLogService('file' and no logBinding( anywhere in apps/** or packages/** source", () => {
    const pattern = new RegExp(["createLogService\\(\\s*'file'", 'log' + 'Binding\\('].join('|'));
    expect(grep(pattern, allSource())).toEqual([]);
  });

  it('AC-19: every QueueHelper call in apps/api passes a request trace carrier, in apps/worker workerTraceCarrier(job), in packages/database dbcliTraceCarrier()', () => {
    const expectations: [string, RegExp][] = [
      ['apps/api/src', /(apiTraceCarrier|traceCarrier)\(/],
      // media.processor builds the per-job carrier once in traceLog() (asserted below)
      ['apps/worker/src', /workerTraceCarrier\(|this\.traceLog\(\)/],
      ['packages/database/src', /dbcliTraceCarrier\(\)/],
    ];
    const missing: string[] = [];
    let total = 0;
    for (const [dir, wanted] of expectations) {
      for (const file of walk(path.join(ROOT, dir), (f) => f.endsWith('.ts') && !isTestFile(f))) {
        for (const call of queueHelperCalls(read(file)).filter((c) => !c.startsWith('createQueue('))) {
          total++;
          if (!wanted.test(call)) missing.push(`${rel(file)}: QueueHelper.${call.slice(0, 60).replace(/\s+/g, ' ')}`);
        }
      }
    }
    // the worker helper is the one place that builds the per-job config
    expect(read(path.join(ROOT, 'apps/worker/src/processors/media.processor.ts'))).toContain('return workerTraceCarrier(this.job)');
    expect(total).toBeGreaterThan(30);
    expect(missing).toEqual([]);
  });

  it('AC-29: no FactoryLogService anywhere, and no `new LogService(` in non-test source except the logService factory and the api spec-only console-logger', () => {
    expect(grep(/FactoryLogService/, [...allSource(), ...skillFiles()])).toEqual([]);
    expect(fs.existsSync(path.join(ROOT, 'packages/backend-lib/src/services/log-service/factory-log.service.ts'))).toBe(false);

    const files = allSource((f) => /\.(ts|tsx)$/.test(f) && !isTestFile(f));
    const offenders = grep(/new LogService\(/, files).filter(
      (f) => f !== 'packages/backend-lib/src/config/logging.ts' && f !== 'apps/api/src/common/testing/console-logger.ts',
    );
    expect(offenders).toEqual([]);
  });

  it('AC-29: the web logger uses logService.web and the api request service uses logService.api', () => {
    expect(read(path.join(ROOT, 'apps/web/src/lib/logging/logger.ts'))).toContain('logService.web(');
    expect(read(path.join(ROOT, 'apps/api/src/common/services/request.service.ts'))).toContain('logService.api(');
    // the worker's project layer builds every worker logger from the job's trace id
    expect(read(path.join(ROOT, 'apps/worker/src/logging.ts'))).toMatch(/logService\.worker\(\{[^}]*jobTraceId\(/);
    // and no worker logger is built anywhere else, so none can be missing the job id
    const stray = grep(/logService\.worker\(/, allSource((f) => /\.(ts|tsx)$/.test(f) && !isTestFile(f) && f.includes(`${path.sep}worker${path.sep}`)))
      .filter((hit) => !hit.startsWith('apps/worker/src/logging.ts'));
    expect(stray).toEqual([]);
  });

  it('AC-26: skills no longer mention the removed logging APIs', () => {
    const pattern = new RegExp(
      ['runWithLog' + 'Context', 'addLog' + 'Correlation', 'currentJob' + 'Attempt', 'configureLog' + 'Process', 'flush' + 'Async', 'LOG_QUEUE logger'].join('|'),
    );
    expect(grep(pattern, skillFiles())).toEqual([]);
    // The skill is SKILL.md plus its references/ (buffer details live there).
    const logging = walk(path.join(ROOT, '.agents', 'skills', 'logging'), (f) => f.endsWith('.md'))
      .map((f) => read(f))
      .join('\n');
    expect(logging).toContain('settle()');
    expect(logging).toContain('logs:pending');
    expect(logging).toContain('isFinalAttempt');
  });

  it('AC-28: each entrypoint sets the process service first thing', () => {
    expect(read(path.join(ROOT, 'apps/api/src/main.ts'))).toContain("setLogProcessService('api')");
    expect(read(path.join(ROOT, 'apps/worker/src/main.ts'))).toContain("setLogProcessService('worker')");
    expect(read(path.join(ROOT, 'packages/database/src/bin/cli.ts'))).toContain("setLogProcessService('dbcli')");
    expect(read(path.join(ROOT, 'apps/web/src/lib/logging/logger.ts'))).toContain('setLogProcessService("web")');
  });

  it('AC-18: the api SIGTERM/SIGINT handler awaits a bounded logBuffer.settle() before process.exit', () => {
    const main = read(path.join(ROOT, 'apps/api/src/main.ts'));
    expect(main).toMatch(/withTimeout\(logBuffer\.settle\(\),\s*SETTLE_LOGS_TIMEOUT_MS/);
    expect(main.indexOf('logBuffer.settle()')).toBeLessThan(main.indexOf('process.exit(0)'));
  });
});

describe('AC-16: apiLogger', () => {
  let added: LogEntry[];
  beforeEach(() => {
    added = [];
    jest.spyOn(logBuffer, 'add').mockImplementation((_context, entry) => void added.push(entry));
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-16: the process buffer is in memory under Jest (no Redis handle)', () => {
    expect(logBuffer).toBeInstanceOf(InMemoryLogBuffer);
  });

  it('AC-16: lines carry service api, the current trace id, and no request key outside HTTP', () => {
    const logger = apiLogger('users');
    logger.info('outside');
    runWithTraceId('JOB-1', () => logger.info('in job'));
    expect(added[0]).toMatchObject({ service: 'api', channel: 'users', id: '' });
    expect('request' in added[0]).toBe(false);
    expect(added[1]).toMatchObject({ service: 'api', id: 'JOB-1' });
    expect('request' in added[1]).toBe(false);
  });

  it('AC-16: inside an HTTP request the line carries the request id and the request context', async () => {
    const logger = apiLogger('users');
    const service = new RequestService(requestStorage);
    await service.run(() => {
      service.method = 'POST';
      logger.info('inside');
    });
    expect(added[0].id).toMatch(UUID);
    expect(added[0].request).toMatchObject({ id: added[0].id, method: 'POST' });
  });

  it('AC-16: apiTraceCarrier carries only service, id and globalContext, and an explicit trace id wins', () => {
    const cfg = apiTraceCarrier('FIXED');
    expect(cfg).toMatchObject({ service: 'api', id: 'FIXED' });
    expect(Object.keys(apiTraceCarrier()).sort()).toEqual(['globalContext', 'id', 'service']);
    expect(typeof apiTraceCarrier().id).toBe('function');
    expect(typeof apiTraceCarrier().globalContext).toBe('function');
  });
});

describe('AC-17: processor jobs and cron runs', () => {
  let added: LogEntry[];
  beforeEach(() => {
    added = [];
    store.clear();
    jest.spyOn(logBuffer, 'add').mockImplementation((_context, entry) => void added.push(entry));
    jest.spyOn(logBuffer, 'flush');
  });
  afterEach(() => jest.restoreAllMocks());

  // A DI logger is shared and built once, outside any job.
  const diLogger = apiLogger('media');
  class TestProcessor extends (GlobalProcessor as any) {
    async process(_job: any) {
      diLogger.info('first');
      await new Promise((r) => setImmediate(r));
      diLogger.info('second');
      return 'done';
    }
  }
  const carrier = (id: string) => JSON.stringify({ v: 1, id });
  const job = (opts: Record<string, unknown>) => ({ id: '1', name: 'n', queueName: 'q', attemptsMade: 0, opts: { attempts: 1, ...opts }, data: {} });

  it('AC-17: a job with carrier id T logs its own DI-logger lines with id T', async () => {
    const processor: any = new TestProcessor();
    await processor.process(job({ telemetry: { metadata: carrier('T') } }));
    const own = added.filter((e) => e.channel === 'media');
    expect(own.map((e) => e.id)).toEqual(['T', 'T']);
    expect(logBuffer.flush).not.toHaveBeenCalled();
  });

  it('AC-17: without a carrier all of the job\'s lines share one fresh UUID, and two jobs differ', async () => {
    const processor: any = new TestProcessor();
    await processor.process(job({}));
    const first = added.filter((e) => e.channel === 'media').map((e) => e.id);
    expect(first[0]).toMatch(UUID);
    expect(new Set(first).size).toBe(1);

    added.length = 0;
    await processor.process(job({}));
    const second = added.filter((e) => e.channel === 'media').map((e) => e.id);
    expect(second[0]).not.toBe(first[0]);
  });

  it('AC-17: concurrent jobs on one shared logger keep their own ids', async () => {
    const processor: any = new TestProcessor();
    await Promise.all([
      processor.process(job({ telemetry: { metadata: carrier('A') } })),
      processor.process(job({ telemetry: { metadata: carrier('B') } })),
    ]);
    const own = added.filter((e) => e.channel === 'media').map((e) => e.id);
    expect(own.filter((id) => id === 'A')).toHaveLength(2);
    expect(own.filter((id) => id === 'B')).toHaveLength(2);
  });

  it('AC-17: a runCron run\'s lines share one fresh UUID and carry cron: <name> in extraInfo; each run differs; nothing flushed', async () => {
    const jobLogger = apiLogger('system');
    await runCronExclusive('nightly-x', CRON_LOCK_TTL.daily, async () => {
      jobLogger.info('inside the cron');
    });
    const lines = added.filter((e) => e.extraInfo && (e.extraInfo as Record<string, unknown>).cron === 'nightly-x');
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0].id).toMatch(UUID);
    expect(new Set(lines.map((e) => e.id)).size).toBe(1);
    const runId = lines[0].id;
    // the cron's own lines and the job's lines share the run id
    expect(added.find((e) => e.message === 'inside the cron')?.id).toBe(runId);

    added.length = 0;
    await runCronExclusive('nightly-y', CRON_LOCK_TTL.daily, async () => undefined);
    expect(added[0].id).toMatch(UUID);
    expect(added[0].id).not.toBe(runId);
    expect(logBuffer.flush).not.toHaveBeenCalled();
  });
});

describe('AC-20: Stripe trace propagation', () => {
  it('AC-20: traceMetadata writes requestId from the api request store (currentRequestId)', () => {
    const metadata = runWithTraceId('REQ-9', () => StripeService.traceMetadata(5));
    expect(metadata).toMatchObject({ user_id: '5', requestId: 'REQ-9' });
    expect(metadata.requestAt).toMatch(/^\d+$/);
    expect(StripeService.traceMetadata(5)).toEqual({ user_id: '5' });
    expect(currentRequestId()).toBeNull();
  });
});
