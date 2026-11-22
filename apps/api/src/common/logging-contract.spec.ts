import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative, sep } from 'path';

const SRC = join(__dirname, '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const all = walk(SRC);
const isSpec = (f: string) => f.endsWith('.spec.ts');
const source = all.filter((f) => !isSpec(f));
const rel = (f: string) => relative(SRC, f).split(sep).join('/');

/** Lines of `files` matching `re`, as `path:line: text`. This spec file is excluded. */
function scan(files: string[], re: RegExp): string[] {
  const hits: string[] = [];
  for (const file of files) {
    if (file === __filename) continue;
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((text, i) => {
        if (re.test(text)) hits.push(`${rel(file)}:${i + 1}: ${text.trim()}`);
      });
  }
  return hits;
}

describe('api logging contract (source scan)', () => {
  it('AC-1: api-logger.ts is gone', () => {
    expect(existsSync(join(SRC, 'common/utils/api-logger.ts'))).toBe(false);
  });

  it('AC-1: no createApiLogger / apiLogConfig / api-logger anywhere in src (specs and comments included)', () => {
    expect(scan(all, /createApiLogger|apiLogConfig|api-logger/)).toEqual([]);
  });

  it('AC-2: no .name( / .channel( on a logger in non-spec source', () => {
    expect(scan(source, /[lL]og\w*\s*\.\s*(name|channel)\(/)).toEqual([]);
  });

  it('AC-3: no LogLineFields anywhere in src', () => {
    expect(scan(all, /LogLineFields/)).toEqual([]);
  });

  it('AC-3: no level call passes a third argument in non-spec source', () => {
    // Multi-line aware: balance parentheses from `<logger>.<level>(` and count top-level commas.
    const offenders: string[] = [];
    const callRe = /\b\w*[lL]og(?:ger|Service)?\w*\s*\.\s*(?:debug|info|warn|error|critical)\s*\(/g;
    for (const file of source) {
      const text = readFileSync(file, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = callRe.exec(text))) {
        let i = m.index + m[0].length;
        let depth = 1;
        let commas = 0;
        let quote: string | null = null;
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
        }
        if (commas >= 2) {
          const line = text.slice(0, m.index).split('\n').length;
          offenders.push(`${rel(file)}:${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('AC-4: no `provide: LogService` anywhere in src', () => {
    expect(scan(all, /provide:\s*LogService/)).toEqual([]);
  });

  it('AC-4: no module exports LogService', () => {
    const offenders: string[] = [];
    for (const file of source.filter((f) => f.endsWith('.module.ts'))) {
      const text = readFileSync(file, 'utf8');
      const exportsBlock = /exports\s*:\s*\[([\s\S]*?)\]/.exec(text)?.[1] ?? '';
      if (/\bLogService\b/.test(exportsBlock)) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it('AC-4: LogService is imported in non-spec src only by common/testing/console-logger.ts', () => {
    const importers: string[] = [];
    for (const file of source) {
      const text = readFileSync(file, 'utf8');
      const imports = text.match(/import\s+(?:type\s+)?\{[^}]*\}\s+from\s+['"][^'"]+['"]/g) ?? [];
      if (imports.some((i) => /\bLogService\b/.test(i.replace(/from\s+['"][^'"]+['"]/, '')))) {
        importers.push(rel(file));
      }
    }
    expect(importers).toEqual(['common/testing/console-logger.ts']);
  });

  it('AC-5: no constructor parameter is typed LogService or ApiLogger in non-spec source', () => {
    expect(
      scan(source, /^\s*(private|protected|public)?\s*(readonly\s+)?\w+\??:\s*(LogService|ApiLogger)\b\s*,?\s*$/).filter(
        // a class field declaration (`private readonly logger: ApiLogger;`) is allowed; ctor params end with a comma
        (hit) => /,\s*$/.test(hit),
      ),
    ).toEqual([]);
  });

  it('AC-5: the plan grep (non-spec) only matches field declarations that end with a semicolon-less line inside a class body, never injected LogService', () => {
    const hits = scan(source, /^\s*(private|protected|public)?\s*(readonly\s+)?\w+\??:\s*LogService\b\s*,?\s*$/);
    expect(hits).toEqual([]);
  });

  it('AC-11: nothing reads the old requestService.log getter (no `.log` property access without a call)', () => {
    const hits = scan(all, /\brequestService\s*\.\s*log\b(?!\s*[(=])/);
    expect(hits).toEqual([]);
  });
});
