jest.mock('@repo/common-lib/config', () => ({ config: () => ({ redis: { url: 'redis://stub' } }) }));

import type { LogEntry } from '@repo/backend-lib/config/logging';

// AC-26: the dbcli's `request` is `{ command }` only while a command runs. A line logged before
// any run (a carrier built at import, a script's enqueue) has no `request` and an empty id.
// `run` is module state, so each case loads a fresh copy of dbcli-audit.

type Loaded = {
  audited: typeof import('../dbcli-audit').audited;
  dbcliTraceCarrier: typeof import('../dbcli-audit').dbcliTraceCarrier;
  enqueueJob: typeof import('@repo/backend-lib/utils').enqueueJob;
  readJobTrace: typeof import('@repo/backend-lib/utils').readJobTrace;
  logBuffer: typeof import('@repo/backend-lib/config/logging').logBuffer;
};

const load = (): Loaded => {
  let loaded!: Loaded;
  jest.isolateModules(() => {
    const audit = require('../dbcli-audit');
    const utils = require('@repo/backend-lib/utils');
    const logging = require('@repo/backend-lib/config/logging');
    loaded = {
      audited: audit.audited,
      dbcliTraceCarrier: audit.dbcliTraceCarrier,
      enqueueJob: utils.enqueueJob,
      readJobTrace: utils.readJobTrace,
      logBuffer: logging.logBuffer,
    };
  });
  return loaded;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const fakeQueue = () => {
  const add = jest.fn(async (name: string, data: unknown, opts: unknown) => ({ id: 'j1', name, data, opts }));
  return { name: 'media', add } as any;
};

describe('dbcli log context', () => {
  let added: LogEntry[];
  let mod: Loaded;

  beforeEach(() => {
    mod = load();
    added = [];
    jest.spyOn(mod.logBuffer, 'add').mockImplementation((_logContext, entry) => void added.push(entry));
    jest.spyOn(mod.logBuffer, 'settle').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-26: a line logged outside a run (through the carrier) is service dbcli, has no request key and id ""', async () => {
    const queue = fakeQueue();
    await mod.enqueueJob(queue, 'demo-job', {}, undefined, mod.dbcliTraceCarrier());

    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ service: 'dbcli', channel: 'queue', operation: 'enqueue', id: '' });
    expect(added[0]).not.toHaveProperty('request');
    // with no run there is no trace to hand to the job
    expect(mod.readJobTrace({ opts: queue.add.mock.calls[0][2] })).toBeNull();
  });

  it('AC-26: the carrier built BEFORE the run reads the run id and command when the line is written', async () => {
    const carrier = mod.dbcliTraceCarrier(); // built first, as the scripts do
    const queue = fakeQueue();
    await mod.audited('db:backup', async () => {
      await mod.enqueueJob(queue, 'demo-job', {}, undefined, carrier);
    })();

    const [started, enqueued, finished] = added;
    expect(added.map((e) => e.message)).toEqual(['dbcli command started', 'Job enqueued', 'dbcli command finished']);
    expect(started.id).toMatch(UUID);
    // the same run id and the same `{ command }` request on all three lines, enqueue included
    for (const entry of added) {
      expect(entry.id).toBe(started.id);
      expect(entry.service).toBe('dbcli');
      expect(entry.request).toEqual({ command: 'db:backup' });
    }
    expect(enqueued).toMatchObject({ channel: 'queue', operation: 'enqueue' });
    expect(started).toMatchObject({ channel: 'system', operation: 'db:backup' });
    expect(finished).toMatchObject({ channel: 'system', operation: 'db:backup' });
    // the enqueued job carries the run id into the worker
    expect(mod.readJobTrace({ opts: queue.add.mock.calls[0][2] })).toEqual({ id: started.id });
  });

  it('AC-26: the request holds only the command, never the logged arguments', async () => {
    await mod.audited('db:x', async () => undefined, ['name'])('someone', { allowProduction: true, steps: '2' });
    expect(added[0].extraInfo).toMatchObject({ name: 'someone', allow_production: true, steps: 2 });
    for (const entry of added) expect(entry.request).toEqual({ command: 'db:x' });
  });

  it('AC-26: a secret passed as an argument (not on the allow-list) is neither logged nor in request', async () => {
    await mod.audited('db:x', async () => undefined, ['password'])('hunter2', { databaseUrl: 'postgres://u:pw@h/db' });
    expect(JSON.stringify(added)).not.toMatch(/hunter2|postgres:\/\//);
  });
});
