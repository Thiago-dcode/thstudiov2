import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_SORT_MODULE_ITEMS } from '@repo/common-lib/constants/sort-module';
import type { SortModuleItem, SortModulesInput } from '@repo/common-lib/types/sort-module';

/** One row to place. Reusable by every sortable module (collections, services, ...). */
export class SortModuleItemRequest implements SortModuleItem {
  @IsInt({ message: 'module_id must be an integer' })
  @Min(1, { message: 'module_id must be at least 1' })
  module_id: number;

  @IsInt({ message: 'position must be an integer' })
  @Min(0, { message: 'position must not be negative' })
  @Max(MAX_SORT_MODULE_ITEMS - 1, {
    message: `position must be less than ${MAX_SORT_MODULE_ITEMS}`,
  })
  position: number;
}

export class SortModulesRequest implements SortModulesInput {
  @IsArray({ message: 'items must be an array' })
  @ArrayMinSize(1, { message: 'items must contain at least 1 item' })
  @ArrayMaxSize(MAX_SORT_MODULE_ITEMS, {
    message: `items must contain at most ${MAX_SORT_MODULE_ITEMS} items`,
  })
  @ValidateNested({ each: true })
  @Type(() => SortModuleItemRequest)
  @ArrayUnique((item: SortModuleItemRequest) => item?.module_id, {
    message: 'items must not repeat a module_id',
  })
  @ArrayUnique((item: SortModuleItemRequest) => item?.position, {
    message: 'items must not repeat a position',
  })
  items: SortModuleItemRequest[];
}
