import type { EnumType } from "@repo/common-lib/constants/enums";
import {
  MAX_COLUMN_BASE_COLUMNS,
  MIN_COLUMN_BASE_COLUMNS,
} from "@repo/common-lib/constants/limits";
import type {
  Layout,
  LayoutConfig,
  PortfolioLayout,
  PortfolioLayoutInput,
} from "@repo/common-lib/types/layout";
import {
  readColumnBaseLayoutConfig,
  readLayoutItemsConfig,
  readUniformLayoutConfig,
} from "@repo/common-lib/utils/layout";

export type LayoutName = EnumType<"LAYOUT_TYPE">;

/** The two groups a configurable layout's config is split into. */
export type LayoutConfigGroup = "layout" | "items";

/** Layouts whose behavior is driven by an editable config object. */
export function layoutSupportsConfig(name: LayoutName): boolean {
  return name === "COLUMN_BASE" || name === "UNIFORM";
}

/** Layouts with options for the grid shape itself (the `layout` group). */
export function layoutSupportsShapeConfig(name: LayoutName): boolean {
  return name === "COLUMN_BASE";
}

/**
 * Normalized config for a layout, filling every missing option with its
 * default. Key order is always `{ layout, items }`: the portfolio provider
 * diffs configs by JSON, so the order must not depend on how a value was built.
 */
export function normalizeLayoutConfig(
  name: LayoutName,
  config: PortfolioLayoutInput["config"],
): LayoutConfig {
  switch (name) {
    case "COLUMN_BASE":
      return readColumnBaseLayoutConfig(config);
    case "UNIFORM":
      return readUniformLayoutConfig(config);
    default:
      return null;
  }
}

/** Default (valid) config for a freshly selected layout. */
export function getDefaultLayoutConfig(name: LayoutName): LayoutConfig {
  return normalizeLayoutConfig(name, null);
}

/**
 * Merge a patch into one group of a layout's config and re-normalize, so the
 * other group (and any untouched option) is kept.
 */
export function patchLayoutConfig(
  name: LayoutName,
  config: PortfolioLayoutInput["config"],
  group: LayoutConfigGroup,
  patch: Record<string, unknown>,
): LayoutConfig {
  const current = normalizeLayoutConfig(name, config);
  if (!current) return null;

  return normalizeLayoutConfig(name, {
    ...current,
    [group]: { ...current[group], ...patch },
  });
}

export function getColumnBaseColumns(
  input: PortfolioLayoutInput | undefined,
): number {
  return readColumnBaseLayoutConfig(input?.config).layout.columns;
}

export function getLayoutShowTitle(
  input: PortfolioLayoutInput | undefined,
): boolean {
  return readLayoutItemsConfig(input?.config).show_title;
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
      return { name: "UNIFORM", config: readUniformLayoutConfig(input.config) };
    case "COLUMN_BASE":
      return {
        name: "COLUMN_BASE",
        config: readColumnBaseLayoutConfig(input.config),
      };
    default:
      return undefined;
  }
}

export const COLUMN_BASE_COLUMN_LIMITS = {
  min: MIN_COLUMN_BASE_COLUMNS,
  max: MAX_COLUMN_BASE_COLUMNS,
} as const;
