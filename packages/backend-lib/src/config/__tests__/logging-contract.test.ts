import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// A source scan, like apps/api/src/common/logging-contract.spec.ts, over everything that is not the
// api: backend-lib, the worker, the web app and the database package (dbcli). It pins the final
// log contract: no removed API is back, and each service builds its logger in exactly one place.

const ROOT = join(__dirname, '..', '..', '..', '..', '..');
const PACKAGES = ['packages/backend-lib/src', 'apps/worker/src', 'apps/web/src', 'packages/database/src'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '.turbo']);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const isTest = (file: string) => /\.(spec|test)\.(ts|tsx)$/.test(file) || file.includes(`${sep}__tests__${sep}`);
const rel = (file: string) => relative(ROOT, file).split(sep).join('/');
const read = (file: string) => readFileSync(file, 'utf8');

const all = PACKAGES.flatMap((p) => walk(join(ROOT, p))).filter((f) => f !== __filename);
const source = all.filter((f) => !isTest(f));

/** Lines of `files` matching `re`, as `path:line: text`. */
function scan(files: string[], re: RegExp): string[] {
  const hits: string[] = [];
  for (const file of files) {
    read(file)
      .split(/\r?\n/)
      .forEach((text, i) => {
        if (re.test(text)) hits.push(`${rel(file)}:${i + 1}: ${text.trim()}`);
      });
  }
  return hits;
}

/** Index of the character after the paren that closes the one just before `from`. Skips strings. */
function closeOf(text: string, from: number): { end: number; commas: number; topLevel: string; objectLevel: string } {
  let depth = 1;
  let commas = 0;
  let quote: string | null = null;
  let topLevel = '';
  let objectLevel = '';
  let i = from;
  for (; i < text.length && depth > 0; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 1) {
      // a trailing comma before the closing paren is not an argument
      if (!/^\s*\)/.test(text.slice(i + 1))) commas++;
    }
    if (depth === 1) topLevel += c;
    // the keys of an object-literal argument: depth 2 is inside its braces, nested objects are deeper
    if (depth === 2) objectLevel += c;
  }
  return { end: i, commas, topLevel, objectLevel };
}

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

describe('logging contract outside the api (source scan)', () => {
  it('scans a real tree (guards against a path typo making every test vacuous)', () => {
    for (const p of PACKAGES) expect(existsSync(join(ROOT, p))).toBe(true);
    expect(source.length).toBeGreaterThan(150);
    expect(source.map(rel)).toEqual(expect.arrayContaining([
      'packages/backend-lib/src/config/logging.ts',
      'apps/worker/src/logging.ts',
      'apps/web/src/lib/logging/logger.ts',
      'packages/database/src/bin/dbcli-audit.ts',
    ]));
  });

  describe('no removed API', () => {
    it('no .name( / .channel( on a logger, and no LogService["name"]', () => {
      expect(scan(source, /[lL]og\w*\s*\.\s*(name|channel)\(/)).toEqual([]);
      expect(scan(source, /LogService\s*\[\s*['"]name['"]\s*\]/)).toEqual([]);
    });

    it('no LogLineFields, backendLibLogConfig, LoggerConfig, logConfig, dbcliLogConfig or helpers/channels', () => {
      expect(scan(source, /LogLineFields|backendLibLogConfig|LoggerConfig|\blogConfig\b|dbcliLogConfig|helpers\/channels/)).toEqual([]);
    });

    it('no createApiLogger / apiLogConfig / api-logger, and jobLogConfig is never given a logConfig', () => {
      expect(scan(source, /createApiLogger|apiLogConfig|api-logger/)).toEqual([]);
      expect(scan(source, /jobLogConfig\([^)]*logConfig/)).toEqual([]);
    });

    it('no service() / set id / set globalContext mutator is called on a logger', () => {
      expect(scan(source, /[lL]og\w*\s*\.\s*service\s*\(/)).toEqual([]);
      expect(scan(source, /\bset\s+(id|globalContext)\s*\(/)).toEqual([]);
    });

    it('LogEntry is never imported from services/log-service (it lives in config/logging)', () => {
      const offenders: string[] = [];
      const importRe = /(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g;
      for (const file of source) {
        const text = read(file);
        let m: RegExpExecArray | null;
        while ((m = importRe.exec(text))) {
          const [, names, from] = m;
          const names_ = names.split(',').map((n) => n.replace(/^\s*type\s+/, '').trim().split(/\s+as\s+/)[0]);
          if (/(^|\/)services\/log-service(\/index)?$/.test(from) || /(^|\/)log-service$/.test(from)) {
            if (names_.includes('LogEntry')) offenders.push(`${rel(file)}:${lineOf(text, m.index)}`);
          }
        }
      }
      expect(offenders).toEqual([]);
    });

    it('no level call has a third argument (info|error|warn|debug|success|critical, incl. webLogger[level](...))', () => {
      const offenders: string[] = [];
      const callRes = [
        /\b\w*[lL]og(?:ger|Service)?\w*\s*\.\s*(?:debug|info|warn|error|critical|success)\s*\(/g,
        /\b\w*[lL]og(?:ger)?\w*\s*\[[^\]\n]+\]\s*\(/g,
      ];
      for (const file of source) {
        const text = read(file);
        // `Logger` from utils/console is a variadic console wrapper (the mail drivers), not a LogService
        if (/from\s+['"][^'"]*utils\/console['"]/.test(text)) continue;
        for (const callRe of callRes) {
          callRe.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = callRe.exec(text))) {
            const { commas } = closeOf(text, m.index + m[0].length);
            if (commas >= 2) offenders.push(`${rel(file)}:${lineOf(text, m.index)}`);
          }
        }
      }
      expect(offenders).toEqual([]);
    });

    it('the scanner itself finds a third argument (it is not vacuous)', () => {
      const probe = 'log.info("m", { a: 1 },\n  { operation: "x" })';
      const m = /\b\w*[lL]og(?:ger|Service)?\w*\s*\.\s*(?:info)\s*\(/.exec(probe)!;
      expect(closeOf(probe, m.index + m[0].length).commas).toBe(2);
      const ok = 'log.info("m", { a: 1, b: [1, 2], c: f(1, 2) },)';
      const n = /\b\w*[lL]og(?:ger|Service)?\w*\s*\.\s*(?:info)\s*\(/.exec(ok)!;
      expect(closeOf(ok, n.index + n[0].length).commas).toBe(1);
    });
  });

  describe('each service builds its logger in one place', () => {
    const callsOf = (service: string) => scan(source, new RegExp(`\\blogService\\s*\\.\\s*${service}\\s*\\(`)).map((hit) => hit.split(':')[0]);

    it('logService.lib( appears only under packages/backend-lib/src', () => {
      const files = callsOf('lib');
      expect(files.length).toBeGreaterThan(3);
      expect(files.filter((f) => !f.startsWith('packages/backend-lib/src/'))).toEqual([]);
    });

    it('logService.worker( appears only in apps/worker/src/logging.ts (and backend-lib)', () => {
      const files = [...new Set(callsOf('worker'))];
      expect(files.filter((f) => !f.startsWith('packages/backend-lib/src/'))).toEqual(['apps/worker/src/logging.ts']);
    });

    it('logService.web( appears only in apps/web/src/lib/logging/logger.ts', () => {
      expect([...new Set(callsOf('web'))].filter((f) => !f.startsWith('packages/backend-lib/src/'))).toEqual([
        'apps/web/src/lib/logging/logger.ts',
      ]);
    });

    it('logService.dbcli( appears only in packages/database/src/bin/dbcli-audit.ts', () => {
      expect([...new Set(callsOf('dbcli'))].filter((f) => !f.startsWith('packages/backend-lib/src/'))).toEqual([
        'packages/database/src/bin/dbcli-audit.ts',
      ]);
    });

    it('no logService.api( outside the api (the api builds its own through RequestService)', () => {
      expect(callsOf('api').filter((f) => !f.startsWith('packages/backend-lib/src/'))).toEqual([]);
    });

    it('no factory call has a top-level channel or name (they are defaultOptions)', () => {
      const offenders: string[] = [];
      const callRe = /\blogService\s*\.\s*(?:api|worker|dbcli|web|lib)\s*\(/g;
      for (const file of source) {
        const text = read(file);
        let m: RegExpExecArray | null;
        while ((m = callRe.exec(text))) {
          const { objectLevel } = closeOf(text, m.index + m[0].length);
          // `objectLevel` keeps only the keys of the argument object: a nested defaultOptions { } is dropped
          if (/(^|[\s,{(])(channel|name)\s*:/.test(objectLevel)) offenders.push(`${rel(file)}:${lineOf(text, m.index)}`);
        }
      }
      expect(offenders).toEqual([]);
    });

    it('the factory-call check is not vacuous: it sees a top-level channel but not a nested one', () => {
      const bad = 'logService.worker({ channel: "media", id: 1 })';
      const good = 'logService.worker({ id: 1, defaultOptions: { channel: "media" } })';
      const top = (text: string) => closeOf(text, text.indexOf('(') + 1).objectLevel;
      expect(/(^|[\s,{(])(channel|name)\s*:/.test(top(bad))).toBe(true);
      expect(/(^|[\s,{(])(channel|name)\s*:/.test(top(good))).toBe(false);
    });
  });

  describe('LogService stays project-agnostic (AC-2)', () => {
    const logServiceFiles = source.filter((f) => rel(f).startsWith('packages/backend-lib/src/services/log-service/'));

    it('has files to scan', () => {
      expect(logServiceFiles.length).toBeGreaterThan(8);
    });

    it('imports neither @repo/common-lib nor config/', () => {
      expect(scan(logServiceFiles, /from\s+['"]@repo\/common-lib|from\s+['"](\.\.?\/)+config(\/|['"])/)).toEqual([]);
      expect(scan(logServiceFiles, /require\(\s*['"]@repo\/common-lib/)).toEqual([]);
    });

    it('names no LogChannel, LogLineFields or Uppercase<', () => {
      expect(scan(logServiceFiles, /\bLogChannel\b|LogLineFields|Uppercase</)).toEqual([]);
    });
  });

  describe('apps/web server logger (AC-22, AC-23)', () => {
    const logger = join(ROOT, 'apps/web/src/lib/logging/logger.ts');
    const webSource = source.filter((f) => rel(f).startsWith('apps/web/src/'));

    it('the first statement of logger.ts is import "server-only", and setLogProcessService("web") runs at module load', () => {
      const code = read(logger)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .trim();
      expect(code.startsWith('import "server-only";')).toBe(true);
      expect(read(logger)).toMatch(/^setLogProcessService\("web"\);$/m);
    });

    it('logger.ts never reads the URL, a header or a cookie', () => {
      const code = read(logger).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code).not.toMatch(/nextUrl|request\.url|\.url\b|headers\s*\(|cookies\s*\(|\.headers\b|\.cookies\b/);
    });

    it('@repo/backend-lib is imported in apps/web/src only by lib/logging/logger.ts', () => {
      const importers = webSource
        .filter((f) => /from\s+['"]@repo\/backend-lib|import\s+['"]@repo\/backend-lib|require\(\s*['"]@repo\/backend-lib/.test(read(f)))
        .map(rel);
      expect(importers).toEqual(['apps/web/src/lib/logging/logger.ts']);
    });

    it('no "use client" in the logger, the oauth route handler or the oauth server action, and the first two have no directive at all', () => {
      const files = [
        logger,
        join(ROOT, 'apps/web/src/app/api/oauth2/[provider]/callback/route.ts'),
        join(ROOT, 'apps/web/src/modules/auth/server-actions/Oauth2Initiate.action.ts'),
      ];
      for (const file of files) expect(read(file)).not.toMatch(/^\s*['"]use client['"]/m);
      expect(read(files[0])).not.toMatch(/^\s*['"]use server['"]/m);
      expect(read(files[1])).not.toMatch(/^\s*['"]use server['"]/m);
      // the server action keeps its own directive: logging work must not have moved the boundary
      expect(read(files[2])).toMatch(/^\s*['"]use server['"]/m);
    });

    it('no client component (use client) imports the server logger', () => {
      const offenders = webSource
        .filter((f) => /^\s*['"]use client['"]/m.test(read(f)))
        .filter((f) => /lib\/logging\/logger/.test(read(f)))
        .map(rel);
      expect(offenders).toEqual([]);
    });

    it('withLogTrace callers pass a context: a route pattern literal or { kind: "action" }, never a URL', () => {
      const callers = webSource.filter((f) => /\bwithLogTrace\s*\(/.test(read(f)) && rel(f) !== 'apps/web/src/lib/logging/logger.ts');
      expect(callers.map(rel).sort()).toEqual([
        'apps/web/src/app/api/oauth2/[provider]/callback/route.ts',
        'apps/web/src/modules/auth/server-actions/Oauth2Initiate.action.ts',
      ]);
      const route = read(join(ROOT, 'apps/web/src/app/api/oauth2/[provider]/callback/route.ts'));
      expect(route).toContain("/api/oauth2/[provider]/callback");
      expect(route).toMatch(/kind:\s*['"]route['"]/);
      expect(read(join(ROOT, 'apps/web/src/modules/auth/server-actions/Oauth2Initiate.action.ts'))).toMatch(/kind:\s*['"]action['"]/);
    });

    it('the web logger reads its id and its context per line from the trace store', () => {
      const code = read(logger);
      expect(code).toMatch(/id:\s*\(\)\s*=>\s*traceStore\.getStore\(\)\?\.traceId/);
      expect(code).toMatch(/globalContext:\s*\(\)\s*=>\s*traceStore\.getStore\(\)\?\.context/);
      expect(code).toMatch(/new AsyncLocalStorage</);
      // the id is a fresh UUID per run, never module state
      expect(code).toMatch(/randomUUID\(\)/);
      expect(code).not.toMatch(/^\s*let\s/m);
    });
  });

  describe('dbcli and worker (AC-19, AC-26)', () => {
    it('the dbcli scripts that enqueue pass dbcliTraceCarrier()', () => {
      for (const file of ['backup.ts', 'generate-media-thumbnail.ts', 'generate-user-thumbnails.ts']) {
        expect(read(join(ROOT, 'packages/database/src/lib/scripts', file))).toContain('dbcliTraceCarrier()');
      }
    });

    it('the worker has no logger of its own outside src/logging.ts', () => {
      const workerFiles = source.filter((f) => rel(f).startsWith('apps/worker/src/') && rel(f) !== 'apps/worker/src/logging.ts');
      expect(scan(workerFiles, /logService\b|new LogService\b|from\s+['"]@repo\/backend-lib\/services\/log-service/)).toEqual([]);
    });
  });
});
