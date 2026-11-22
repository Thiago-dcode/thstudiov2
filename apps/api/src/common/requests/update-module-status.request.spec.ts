import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateModuleStatusRequest, hasModuleStatusChange } from './update-module-status.request';

const errorsFor = async (body: unknown) =>
  validate(plainToInstance(UpdateModuleStatusRequest, body as object), { whitelist: true });

describe('UpdateModuleStatusRequest', () => {
  it.each([
    [{ is_active: false }],
    [{ is_highlight: true }],
    [{ is_highlight: true, is_active: false }],
    [{}],
  ])('AC-13: accepts %j at the DTO level', async (body) => {
    expect(await errorsFor(body)).toHaveLength(0);
  });

  it.each([
    [{ is_active: 'true' }],
    [{ is_active: 'false' }],
    [{ is_highlight: 1 }],
    [{ is_highlight: 0 }],
    [{ is_highlight: true, is_active: 'yes' }],
  ])('AC-14: rejects non-boolean %j', async (body) => {
    expect((await errorsFor(body)).length).toBeGreaterThan(0);
  });

  it.each([[{ is_active: null }], [{ is_highlight: null }]])(
    'AC-13/AC-14: a null (%j) is never both accepted by the DTO and counted as a change (it would be written as NULL)',
    async (body) => {
      const dto = plainToInstance(UpdateModuleStatusRequest, body as object);
      const errors = await validate(dto, { whitelist: true });
      expect(errors.length > 0 || !hasModuleStatusChange(dto)).toBe(true);
    },
  );
});

describe('hasModuleStatusChange', () => {
  it('AC-14: is false for an empty body', () => {
    expect(hasModuleStatusChange({})).toBe(false);
  });

  it('AC-14: is false when only unknown keys survive (whitelist strips them)', () => {
    const dto = plainToInstance(UpdateModuleStatusRequest, { bogus: true } as object);
    expect(hasModuleStatusChange(dto)).toBe(false);
  });

  it.each([
    [{ is_highlight: false }],
    [{ is_active: false }],
    [{ is_highlight: true, is_active: true }],
  ])('AC-13: is true when %j has a defined key (false counts as a change)', (body) => {
    expect(hasModuleStatusChange(body)).toBe(true);
  });
});
