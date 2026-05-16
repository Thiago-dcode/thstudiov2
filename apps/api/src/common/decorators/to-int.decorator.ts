import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, ValidationOptions } from 'class-validator';

/**
 * Validates + coerces values to integers.
 * Handles numeric strings (e.g. multipart/form-data and query params).
 * Preserves `undefined` / `null` / `''` so `@IsOptional()` still works.
 *
 * Invalid strings are left unchanged so `@IsInt()` fails with a clear validation error.
 */
export const ToInt = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    Transform(({ value }) => {
      if (value === '' || value === undefined || value === null) return undefined;
      if (typeof value === 'number') return value;
      const n = parseInt(String(value), 10);
      return Number.isNaN(n) ? value : n;
    }),
    IsInt(validationOptions),
  );
