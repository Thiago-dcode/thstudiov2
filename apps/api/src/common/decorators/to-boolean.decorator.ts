import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

/**
 * Validates + converts stringy booleans to real booleans.
 * Handles `"true"`, `"1"` → `true` and `"false"`, `"0"` → `false`.
 * Preserves `undefined`/`null` so `@IsOptional()` still works.
 *
 * Use for **query params** and **multipart/form-data** fields (both arrive as strings).
 * For typical **JSON** request bodies, native booleans usually do not need this.
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
