import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumber, Max, Min, ValidationOptions } from 'class-validator';
import { MAX_SERVICE_PRICE } from '@repo/common-lib/constants/limits';

/**
 * Coerces price input to a number rounded to 2 decimal places, then validates
 * it falls within [0, MAX_SERVICE_PRICE] — safely inside Postgres `real` range.
 * Preserves `undefined`/`null`/`''` so `@IsOptional()` still works.
 */
export const ToPrice = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    Transform(({ value }) => {
      if (value === '' || value === undefined || value === null) return undefined;
      const n = typeof value === 'number' ? value : Number(value);
      return Number.isNaN(n) ? value : Math.round(n * 100) / 100;
    }),
    IsNumber({ maxDecimalPlaces: 2 }, validationOptions),
    Min(0, validationOptions),
    Max(MAX_SERVICE_PRICE, validationOptions),
  );
