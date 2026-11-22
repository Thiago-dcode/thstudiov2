import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MAX_SORT_MODULE_ITEMS } from '@repo/common-lib/constants/sort-module';
import { SortModulesRequest } from './sort-modules.request';

/** Same transform the global ValidationPipe applies (`transform: true`, no implicit conversion). */
const errorsFor = async (body: unknown) =>
  validate(plainToInstance(SortModulesRequest, body as object), { whitelist: true });

const item = (module_id: unknown, position: unknown) => ({ module_id, position });

describe('SortModulesRequest', () => {
  it('AC-4: accepts a valid payload', async () => {
    expect(await errorsFor({ items: [item(1, 0), item(2, 1), item(3, 2)] })).toHaveLength(0);
  });

  it('AC-4: accepts the boundary values (position 0 and MAX-1, a full-size list)', async () => {
    expect(await errorsFor({ items: [item(1, 0), item(2, MAX_SORT_MODULE_ITEMS - 1)] })).toHaveLength(0);
    const full = Array.from({ length: MAX_SORT_MODULE_ITEMS }, (_, i) => item(i + 1, i));
    expect(await errorsFor({ items: full })).toHaveLength(0);
  });

  it.each([
    ['missing items', {}],
    ['items is not an array (object)', { items: { module_id: 1, position: 0 } }],
    ['items is not an array (string)', { items: 'nope' }],
    ['items is null', { items: null }],
    ['an empty array', { items: [] }],
  ])('AC-4: rejects %s', async (_label, body) => {
    expect((await errorsFor(body)).length).toBeGreaterThan(0);
  });

  it('AC-4: rejects more than MAX_SORT_MODULE_ITEMS items', async () => {
    const tooMany = Array.from({ length: MAX_SORT_MODULE_ITEMS + 1 }, (_, i) => item(i + 1, i % MAX_SORT_MODULE_ITEMS));
    expect((await errorsFor({ items: tooMany })).length).toBeGreaterThan(0);
  });

  it.each([
    ['module_id 0', item(0, 0)],
    ['module_id negative', item(-3, 0)],
    ['module_id fractional', item(1.5, 0)],
    ['module_id a string number', item('1', 0)],
    ['module_id missing', { position: 0 }],
    ['module_id null', item(null, 0)],
    ['position negative', item(1, -1)],
    ['position fractional', item(1, 0.5)],
    ['position >= MAX_SORT_MODULE_ITEMS', item(1, MAX_SORT_MODULE_ITEMS)],
    ['position a string number', item(1, '1')],
    ['position missing', { module_id: 1 }],
    ['position NaN', item(1, Number.NaN)],
  ])('AC-4: rejects an item with %s', async (_label, bad) => {
    expect((await errorsFor({ items: [bad] })).length).toBeGreaterThan(0);
  });

  it('AC-4: rejects a non-object item', async () => {
    expect((await errorsFor({ items: [5] })).length).toBeGreaterThan(0);
    expect((await errorsFor({ items: [null] })).length).toBeGreaterThan(0);
  });

  it('AC-4: rejects a duplicate module_id (and reports the module_id rule)', async () => {
    const errors = await errorsFor({ items: [item(1, 0), item(1, 1)] });
    expect(errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(errors)).toMatch(/module_id/);
  });

  it('AC-4: rejects a duplicate position (and reports the position rule)', async () => {
    const errors = await errorsFor({ items: [item(1, 0), item(2, 0)] });
    expect(errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(errors)).toMatch(/repeat a position/);
  });

  it('AC-4: both uniqueness rules fire independently', async () => {
    const dupId = JSON.stringify(await errorsFor({ items: [item(1, 0), item(1, 1)] }));
    const dupPos = JSON.stringify(await errorsFor({ items: [item(1, 0), item(2, 0)] }));
    expect(dupId).toMatch(/repeat a module_id/);
    expect(dupId).not.toMatch(/repeat a position/);
    expect(dupPos).not.toMatch(/repeat a module_id/);
  });
});
