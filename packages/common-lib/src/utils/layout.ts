import {
  DEFAULT_LAYOUT_ITEMS_CONFIG,
  MAX_COLUMN_BASE_COLUMNS,
  MIN_COLUMN_BASE_COLUMNS,
} from '../constants/limits';
import type {
  ColumBaseLayoutConfig,
  LayoutItemsConfig,
  UniformLayoutConfig,
} from '../types/layout';

type ConfigGroupName = 'layout' | 'items';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read one group (`layout` / `items`) of a grouped layout config, or undefined when absent or malformed. */
export function getLayoutConfigGroup(
  config: unknown,
  group: ConfigGroupName,
): Record<string, unknown> | undefined {
  if (!isRecord(config)) return undefined;
  const value = config[group];
  return isRecord(value) ? value : undefined;
}

/** Clamp a column count into the supported range as an integer. */
export function clampColumnBaseColumns(columns: number): number {
  return Math.min(
    MAX_COLUMN_BASE_COLUMNS,
    Math.max(MIN_COLUMN_BASE_COLUMNS, Math.trunc(columns)),
  );
}

/** Items group with defaults; a non-boolean option falls back to its default. */
export function readLayoutItemsConfig(config: unknown): LayoutItemsConfig {
  const showTitle = getLayoutConfigGroup(config, 'items')?.show_title;
  return {
    show_title:
      typeof showTitle === 'boolean'
        ? showTitle
        : DEFAULT_LAYOUT_ITEMS_CONFIG.show_title,
  };
}

/** Lenient COLUMN_BASE reader for stored/edited configs: invalid columns fall back to the minimum. */
export function readColumnBaseLayoutConfig(config: unknown): ColumBaseLayoutConfig {
  const columns = getLayoutConfigGroup(config, 'layout')?.columns;
  return {
    layout: {
      columns: clampColumnBaseColumns(
        typeof columns === 'number' && Number.isFinite(columns)
          ? columns
          : MIN_COLUMN_BASE_COLUMNS,
      ),
    },
    items: readLayoutItemsConfig(config),
  };
}

export function readUniformLayoutConfig(config: unknown): UniformLayoutConfig {
  return {
    layout: {},
    items: readLayoutItemsConfig(config),
  };
}
