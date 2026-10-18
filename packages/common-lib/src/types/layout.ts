import { LayoutSchema } from '../schemas/layout';
import { OffsetPaginationRequest } from './request';

export type LayoutIndexRequest = OffsetPaginationRequest & {
  is_active?: boolean;
};

/** Per-item options, shared by every layout that renders configurable items. */
export type LayoutItemsConfig = {
  show_title: boolean;
};

/**
 * Configurable layouts split their config into two groups: `layout` shapes the
 * grid as a whole, `items` controls how each tile renders.
 */
type GroupedLayoutConfig<TLayout> = {
  layout: TLayout;
  items: LayoutItemsConfig;
};

export type MansoryLayoutConfig = null;
export type UniformLayoutConfig = GroupedLayoutConfig<Record<string, never>>;
export type ColumBaseLayoutConfig = GroupedLayoutConfig<{
  columns: number;
}>;
export type LayoutConfig = MansoryLayoutConfig | UniformLayoutConfig | ColumBaseLayoutConfig

export type MasonryLayout = {
  name: 'MASONRY';
  config: MansoryLayoutConfig;
  /** id of the `layouts` row this resolved from (present when joined from a portfolio). */
  layout_id?: number;
};

export type UniformLayout = {
  name: 'UNIFORM';
  config: UniformLayoutConfig;
  /** id of the `layouts` row this resolved from (present when joined from a portfolio). */
  layout_id?: number;
};

export type ColumnBaseLayout = {
  name: 'COLUMN_BASE';
  config: ColumBaseLayoutConfig;
  /** id of the `layouts` row this resolved from (present when joined from a portfolio). */
  layout_id?: number;
};

export type PortfolioLayout = MasonryLayout | UniformLayout | ColumnBaseLayout;

/** Input payload for create/update portfolio (layout_id + optional raw config). */
export type PortfolioLayoutInput = {
  layout_id: number;
  config?: LayoutConfig | Record<string, unknown> | null;
};

export type Layout = Omit<LayoutSchema, 'created_at' | 'updated_at'>;
