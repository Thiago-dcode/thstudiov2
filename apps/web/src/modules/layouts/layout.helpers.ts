import {
  MAX_COLUMN_BASE_COLUMNS,
  MIN_COLUMN_BASE_COLUMNS,
} from "@repo/common-lib/constants/constants";
import type { EnumType } from "@repo/common-lib/constants/enums";
import type {
  ColumBaseLayoutConfig,
  Layout,
  LayoutConfig,
  PortfolioLayout,
  PortfolioLayoutInput,
} from "@repo/common-lib/types/layout";

export type LayoutName = EnumType<"LAYOUT_TYPE">;

/** Layouts whose behavior is driven by an editable config object. */
export function layoutSupportsConfig(name: LayoutName): boolean {
  return name === "COLUMN_BASE";
}

/** Default (valid) config for a freshly selected layout. */
export function getDefaultLayoutConfig(name: LayoutName): LayoutConfig {
  switch (name) {
    case "COLUMN_BASE":
      return { columns: MIN_COLUMN_BASE_COLUMNS };
    default:
      return null;
  }
}

function readColumns(config: PortfolioLayoutInput["config"]): number {
  if (
    config &&
    typeof config === "object" &&
    typeof (config as { columns?: unknown }).columns === "number"
  ) {
    return (config as { columns: number }).columns;
  }
  return MIN_COLUMN_BASE_COLUMNS;
}

/** Clamp a column count into the supported range as an integer. */
export function clampColumnBaseColumns(columns: number): number {
  return Math.min(
    MAX_COLUMN_BASE_COLUMNS,
    Math.max(MIN_COLUMN_BASE_COLUMNS, Math.trunc(columns)),
  );
}

export function getColumnBaseColumns(
  input: PortfolioLayoutInput | undefined,
): number {
  return clampColumnBaseColumns(readColumns(input?.config));
}

/**
 * Convert the editor's selection (`layout_id` + raw config) into a typed
 * `PortfolioLayout` the gallery components can render. Returns undefined when
 * the selected layout id is not in the provided list.
 */
export function buildPortfolioLayout(
  layouts: Layout[],
  input: PortfolioLayoutInput | undefined,
): PortfolioLayout | undefined {
  if (!input) return undefined;

  const layout = layouts.find((item) => item.id === input.layout_id);
  if (!layout) return undefined;

  switch (layout.name) {
    case "MASONRY":
      return { name: "MASONRY", config: null };
    case "UNIFORM":
      return { name: "UNIFORM", config: null };
    case "COLUMN_BASE":
      return {
        name: "COLUMN_BASE",
        config: {
          columns: clampColumnBaseColumns(readColumns(input.config)),
        } satisfies ColumBaseLayoutConfig,
      };
    default:
      return undefined;
  }
}

export const COLUMN_BASE_COLUMN_LIMITS = {
  min: MIN_COLUMN_BASE_COLUMNS,
  max: MAX_COLUMN_BASE_COLUMNS,
} as const;
