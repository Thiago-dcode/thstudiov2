import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

/**
 * Validates + converts query-string booleans to real booleans.
 * Handles `"true"`, `"1"` → `true` and `"false"`, `"0"` → `false`.
 * Preserves `undefined`/`null` so `@IsOptional()` still works.
 *
 * Use on every `boolean` query-param property instead of bare `@IsBoolean()`.
 * Query params arrive as strings; `Boolean("0")` and `Boolean("false")`
 * are both `true` in JS, so explicit mapping is required.
 */
export const ToBoolean = () =>
  applyDecorators(
    Transform(({ value }) => {
      if (value === undefined || value === null) return undefined;
      if (value === true || value === 'true' || value == '1') return true;
      if (value === false || value === 'false' || value == '0') return false;
      return undefined;
    }),
    IsBoolean(),
  );
