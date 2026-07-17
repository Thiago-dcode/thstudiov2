import { BadRequestException } from '@nestjs/common';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';
import { ModelExist } from 'src/common/validators/model-exist.validtor';
import { ToInt } from 'src/common/decorators/to-int.decorator';

export class PortfolioLayoutInput {
  @IsNotEmpty()
  @ToInt()
  @ModelExist('layouts', 'id', {
    extraConditions: [['is_active', '=', true] as [string, '=', boolean]],
  })
  layout_id: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  config?: Record<string, unknown> | null;
}

export function transformPortfolioLayout(
  value: unknown,
): PortfolioLayoutInput | undefined {
  if (value == null || value === '') return undefined;

  try {
    const parsed: unknown =
      typeof value === 'string' ? JSON.parse(value) : value;
    return plainToInstance(PortfolioLayoutInput, parsed);
  } catch {
    throw new BadRequestException('Invalid JSON in "layout" field');
  }
}

export const TransformPortfolioLayout = () =>
  Transform(({ value }): PortfolioLayoutInput | undefined =>
    transformPortfolioLayout(value),
  );
