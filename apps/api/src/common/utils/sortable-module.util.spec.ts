jest.mock('src/common/utils/owned-ids.util', () => ({
  assertOwnedIds: jest.fn(),
  classifyOwnedIds: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { classifyOwnedIds } from 'src/common/utils/owned-ids.util';
import { reorderOwnedModules, updateOwnedModuleStatus } from './sortable-module.util';

const classify = classifyOwnedIds as jest.MockedFunction<typeof classifyOwnedIds>;

const makeLog = () => {
  const calls: { level: string; message: string; extra: any }[] = [];
  const mk = (level: string) => (message: string, extra?: unknown) => calls.push({ level, message, extra });
  return {
    log: { info: mk('info'), success: mk('success'), critical: mk('critical'), warn: mk('warn'), error: mk('error') } as never,
    calls,
  };
};

const PORTFOLIO = { subject: 'Portfolio', plural: 'portfolios', idKey: 'portfolio_id' };
const COLLECTION = { subject: 'Collection', plural: 'collections', idKey: 'collection_id' };
const SERVICE = { subject: 'Service', plural: 'services', idKey: 'service_id' };

describe('reorderOwnedModules log lines match the previous per-module lines', () => {
  beforeEach(() => {
    classify.mockReset();
    classify.mockResolvedValue({ missing: [], foreign: [] });
  });

  it.each([
    [PORTFOLIO, 'Portfolio reorder started', 'Portfolio reorder completed', 'Portfolio reorder targeted foreign portfolios', 'Portfolio not found'],
    [COLLECTION, 'Collection reorder started', 'Collection reorder completed', 'Collection reorder targeted foreign collections', 'Collection not found'],
    [SERVICE, 'Service reorder started', 'Service reorder completed', 'Service reorder targeted foreign services', 'Service not found'],
  ])('AC-17: %j', async (labels, started, completed, foreignMsg, notFound) => {
    const ok = makeLog();
    const onChanged = jest.fn();
    await expect(
      reorderOwnedModules({
        labels,
        table: TABLES_ENUM.SERVICES,
        log: ok.log,
        userId: 3,
        items: [{ module_id: 1, position: 0 }],
        write: async () => 1,
        onChanged,
      }),
    ).resolves.toEqual({ updated_count: 1 });
    expect(ok.calls).toEqual([
      { level: 'info', message: started, extra: { user_id: 3, item_count: 1 } },
      { level: 'success', message: completed, extra: { user_id: 3, item_count: 1, updated_count: 1 } },
    ]);
    expect(onChanged).toHaveBeenCalledWith(3);

    classify.mockResolvedValue({ missing: [], foreign: [9, 8] });
    const bad = makeLog();
    const write = jest.fn();
    await expect(
      reorderOwnedModules({
        labels,
        table: TABLES_ENUM.SERVICES,
        log: bad.log,
        userId: 3,
        items: [{ module_id: 1, position: 0 }],
        write,
        onChanged,
      }),
    ).rejects.toThrow(new BadRequestException(notFound).message);
    expect(bad.calls[1]).toEqual({
      level: 'critical',
      message: foreignMsg,
      extra: { user_id: 3, item_count: 1, foreign_count: 2, step: 'ownership' },
    });
    expect(write).not.toHaveBeenCalled();
  });

  it('AC-17: a zero write does not call onChanged', async () => {
    const onChanged = jest.fn();
    await reorderOwnedModules({
      labels: SERVICE,
      table: TABLES_ENUM.SERVICES,
      log: makeLog().log,
      userId: 3,
      items: [{ module_id: 1, position: 0 }],
      write: async () => 0,
      onChanged,
    });
    expect(onChanged).not.toHaveBeenCalled();
  });
});

describe('updateOwnedModuleStatus log lines match the previous per-module lines', () => {
  const current = { id: 5, user_id: 3, slug: 's', is_highlight: false, is_active: true };

  it.each([
    [PORTFOLIO, 'Portfolio', 'a foreign portfolio'],
    [COLLECTION, 'Collection', 'a foreign collection'],
    [SERVICE, 'Service', 'a foreign service'],
  ])('AC-17: %j', async (labels, subject, foreignPhrase) => {
    const ok = makeLog();
    const onChanged = jest.fn();
    await updateOwnedModuleStatus({
      labels,
      log: ok.log,
      userId: 3,
      id: 5,
      request: { is_active: false } as never,
      getCurrent: async () => current,
      enforceHighlightLimit: async () => undefined,
      write: async () => ({ id: 5, is_highlight: false, is_active: false }),
      onChanged,
    });
    expect(ok.calls).toEqual([
      { level: 'info', message: `${subject} status update started`, extra: { user_id: 3, [labels.idKey]: 5, fields: 'is_active' } },
      {
        level: 'success',
        message: `${subject} status updated`,
        extra: { user_id: 3, [labels.idKey]: 5, is_highlight: false, is_active: false, changed: true },
      },
    ]);
    expect(onChanged).toHaveBeenCalledWith(current);

    const bad = makeLog();
    await expect(
      updateOwnedModuleStatus({
        labels,
        log: bad.log,
        userId: 3,
        id: 5,
        request: { is_active: false } as never,
        getCurrent: async () => ({ ...current, user_id: 99 }),
        enforceHighlightLimit: async () => undefined,
        write: jest.fn(),
        onChanged,
      }),
    ).rejects.toThrow(`${subject} not found`);
    expect(bad.calls[1]).toEqual({
      level: 'critical',
      message: `${subject} status update targeted ${foreignPhrase}`,
      extra: { user_id: 3, [labels.idKey]: 5, step: 'ownership' },
    });
  });

  it('AC-17: empty body is refused before anything else runs', async () => {
    const getCurrent = jest.fn();
    const { log, calls } = makeLog();
    await expect(
      updateOwnedModuleStatus({
        labels: SERVICE,
        log,
        userId: 3,
        id: 5,
        request: {} as never,
        getCurrent,
        enforceHighlightLimit: jest.fn(),
        write: jest.fn(),
        onChanged: jest.fn(),
      }),
    ).rejects.toThrow('Nothing to update');
    expect(getCurrent).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it('AC-17: a no-op write skips onChanged and reports changed:false with current values', async () => {
    const onChanged = jest.fn();
    const { log, calls } = makeLog();
    await expect(
      updateOwnedModuleStatus({
        labels: SERVICE,
        log,
        userId: 3,
        id: 5,
        request: { is_active: true } as never,
        getCurrent: async () => current,
        enforceHighlightLimit: async () => undefined,
        write: async () => null,
        onChanged,
      }),
    ).resolves.toEqual({ id: 5, is_highlight: false, is_active: true });
    expect(onChanged).not.toHaveBeenCalled();
    expect(calls[1].extra.changed).toBe(false);
  });
});
