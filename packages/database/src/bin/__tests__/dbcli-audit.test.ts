jest.mock('@repo/common-lib/config', () => ({ config: () => ({ redis: { url: 'redis://stub' } }) }));

import fs from 'node:fs';
import path from 'node:path';
import { logBuffer } from '@repo/backend-lib/config/logging';
import type { LogEntry } from '@repo/backend-lib/services/log-service';
import { audited, dbcliLogConfig } from '../dbcli-audit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('audited (dbcli)', () => {
  let added: LogEntry[];
  let events: string[];
  let flush: jest.SpyInstance;
  let settle: jest.SpyInstance;

  beforeEach(() => {
    added = [];
    events = [];
    jest.spyOn(logBuffer, 'add').mockImplementation((entry) => {
      added.push(entry);
      events.push(`add:${entry.message}`);
    });
    settle = jest.spyOn(logBuffer, 'settle').mockImplementation(async () => {
      events.push('settle');
    });
    flush = jest.spyOn(logBuffer, 'flush');
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-22: logs started, settles BEFORE the action, then logs finished; never flushes', async () => {
    await audited('demo', async () => {
      events.push('action');
    })();
    expect(events.indexOf('settle')).toBeGreaterThan(events.indexOf('add:dbcli command started'));
    expect(events.indexOf('action')).toBeGreaterThan(events.indexOf('settle'));
    expect(events.indexOf('add:dbcli command finished')).toBeGreaterThan(events.indexOf('action'));
    expect(events[events.length - 1]).toBe('settle');
    expect(settle).toHaveBeenCalledTimes(2);
    expect(flush).not.toHaveBeenCalled();
  });

  it('AC-22: every line of one run shares one fresh UUID, written under service dbcli, and dbcliLogConfig() reads it', async () => {
    let seenByConfig: unknown;
    await audited('demo', async () => {
      seenByConfig = (dbcliLogConfig().id as () => unknown)();
    })();
    const ids = added.map((e) => e.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(UUID);
    expect(new Set(ids).size).toBe(1);
    expect(seenByConfig).toBe(ids[0]);
    for (const e of added) expect(e).toMatchObject({ service: 'dbcli' });
    expect(dbcliLogConfig()).toMatchObject({ service: 'dbcli' });
  });

  it('AC-22: a second run gets a different id', async () => {
    await audited('demo', async () => undefined)();
    await audited('demo', async () => undefined)();
    const started = added.filter((e) => e.message === 'dbcli command started').map((e) => e.id);
    expect(started).toHaveLength(2);
    expect(started[0]).not.toBe(started[1]);
  });

  it('AC-22: a failing action logs "failed", rethrows, settles in finally and never flushes', async () => {
    const failure = new Error('boom');
    await expect(
      audited('demo', async () => {
        throw failure;
      })(),
    ).rejects.toBe(failure);
    expect(added.map((e) => e.message)).toEqual(['dbcli command started', 'dbcli command failed']);
    expect(events[events.length - 1]).toBe('settle');
    expect(flush).not.toHaveBeenCalled();
  });

  it('AC-22: no ambient log context file, cli.ts uses parseAsync + settle + exit, seeds do not flush', () => {
    const bin = path.join(__dirname, '..');
    expect(fs.existsSync(path.join(bin, 'log-process.ts'))).toBe(false);
    const cli = fs.readFileSync(path.join(bin, 'cli.ts'), 'utf8');
    expect(cli).not.toContain('log-process');
    expect(cli).toContain('program.parseAsync(process.argv)');
    expect(cli).toMatch(/logBuffer\.settle\(\)/);
    expect(cli).toMatch(/process\.exit\(1\)/);
    expect(cli).toContain("setLogProcessService('dbcli')");
    const seeds = path.join(bin, '..', 'seeds');
    for (const f of fs.readdirSync(seeds).filter((n) => n.endsWith('.ts'))) {
      expect(fs.readFileSync(path.join(seeds, f), 'utf8')).not.toMatch(/\.flush\(/);
    }
  });
});
