import { LayoutSchema } from '../schemas/layout';


export type MansoryLayoutConfig = null;
export type UniformLayoutConfig = null;
export type ColumBaseLayoutConfig = {
  columns: number;
}
export type LayoutConfig = MansoryLayoutConfig | UniformLayoutConfig | ColumBaseLayoutConfig

export type MasonryLayout = {
  name: 'MASONRY';
  config: MansoryLayoutConfig;
};

export type UniformLayout = {
  name: 'UNIFORM';
  config: UniformLayoutConfig;
};

export type ColumnBaseLayout = {
  name: 'COLUMN_BASE';
  config: ColumBaseLayoutConfig;
};

export type PortfolioLayout = MasonryLayout | UniformLayout | ColumnBaseLayout;

/** Input payload for create/update portfolio (layout_id + optional raw config). */
export type PortfolioLayoutInput = {
  layout_id: number;
  config?: LayoutConfig | Record<string, unknown> | null;
};

export type Layout = Omit<LayoutSchema, 'created_at' | 'updated_at'>;
