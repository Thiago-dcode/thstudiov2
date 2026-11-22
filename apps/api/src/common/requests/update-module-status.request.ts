import { IsBoolean, ValidateIf } from 'class-validator';
import type { ModuleStatusInput } from '@repo/common-lib/types/module-status';

/** Strict JSON booleans (no `ToBoolean` coercion). Reusable by every module with these switches. */
export class UpdateModuleStatusRequest implements ModuleStatusInput {
  // Not @IsOptional(): that also lets null through, and null must never reach SET.
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean({ message: 'is_highlight must be a boolean' })
  is_highlight?: boolean;

  // Not @IsOptional(): that also lets null through, and null must never reach SET.
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

/** At least one switch was sent. An empty body (or one with only unknown keys) changes nothing. */
export const hasModuleStatusChange = (input: ModuleStatusInput): boolean =>
  typeof input.is_highlight === "boolean" || typeof input.is_active === "boolean";
