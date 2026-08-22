import {
  COLUMN_BASE_RESPONSIVE_CAPS,
  MAX_COLUMN_BASE_COLUMNS,
  MIN_COLUMN_BASE_COLUMNS,
} from "@repo/common-lib/constants/limits";
import type { PortfolioLayout } from "@repo/common-lib/types/layout";
import type { CSSProperties } from "react";

export const DEFAULT_PORTFOLIO_LAYOUT: PortfolioLayout = {
  name: "MASONRY",
  config: null,
};

export { COLUMN_BASE_RESPONSIVE_CAPS };

const IMAGE_TRANSITION =
  "transition-transform duration-700 ease-out group-hover:scale-105";

const GRID_CLASS_NAME: Record<PortfolioLayout["name"], string> = {
  MASONRY: "layout-masonry",
  UNIFORM: "layout-uniform",
  COLUMN_BASE: "layout-column-base",
};

const IMAGE_CLASS_NAME: Record<PortfolioLayout["name"], string> = {
  // Masonry cells own their aspect ratio → image fills and covers.
  MASONRY: `h-full w-full object-cover ${IMAGE_TRANSITION}`,
  // Uniform cells are square → image is contained (letterboxed) inside.
  UNIFORM: `max-h-full max-w-full h-auto w-auto object-contain ${IMAGE_TRANSITION}`,
  // Column-base cells are square → image fills and covers edge-to-edge.
  COLUMN_BASE: `h-full w-full object-cover ${IMAGE_TRANSITION}`,
};

export function normalizeGalleryLayout(
  layout?: PortfolioLayout,
): PortfolioLayout {
  return layout ?? DEFAULT_PORTFOLIO_LAYOUT;
}

export function getGalleryGridClassName(layout: PortfolioLayout): string {
  return GRID_CLASS_NAME[layout.name];
}

export function getGalleryImageClassName(layout: PortfolioLayout): string {
  return IMAGE_CLASS_NAME[layout.name];
}

/** Only masonry maps aspect ratios into span buckets via `data-ratio`. */
export function usesAspectRatioBuckets(layout: PortfolioLayout): boolean {
  return layout.name === "MASONRY";
}

/**
 * A single-column COLUMN_BASE behaves like a stacked list: cropping every
 * item into a square wastes the media's real shape, so cells should size
 * themselves off the media's own aspect ratio instead (like masonry, but
 * without the span/bucket logic since there's only one column).
 *
 * Resolved columns are consistent across breakpoints when configured as 1
 * (min(1, any cap) is always 1), so this check doesn't need a viewport.
 */
export function isSingleColumnLayout(layout: PortfolioLayout): boolean {
  return layout.name === "COLUMN_BASE" && resolveColumnBaseColumns(layout) === 1;
}

/** Masonry needs a container-query wrapper for its square base cells. */
export function needsMasonryWrapper(layout: PortfolioLayout): boolean {
  return layout.name === "MASONRY";
}

/**
 * Resolve the effective column count for COLUMN_BASE, clamped to the
 * supported range. Falls back to the minimum (1) when config is null.
 */
export function resolveColumnBaseColumns(layout: PortfolioLayout): number {
  if (layout.name !== "COLUMN_BASE") {
    return MIN_COLUMN_BASE_COLUMNS;
  }

  const columns = layout.config?.columns ?? MIN_COLUMN_BASE_COLUMNS;

  return Math.min(
    MAX_COLUMN_BASE_COLUMNS,
    Math.max(MIN_COLUMN_BASE_COLUMNS, Math.trunc(columns)),
  );
}

/**
 * Inline style exposing the resolved, per-breakpoint column counts to CSS.
 * CSS media queries pick the right variable; the counts are pre-capped here
 * (repeat() can't take min()/calc()). Only COLUMN_BASE is configurable.
 */
export function getGalleryGridContainerStyle(
  layout: PortfolioLayout,
): CSSProperties | undefined {
  if (layout.name !== "COLUMN_BASE") {
    return undefined;
  }

  const columns = resolveColumnBaseColumns(layout);

  return {
    "--layout-cols-mobile": Math.min(columns, COLUMN_BASE_RESPONSIVE_CAPS.mobile),
    "--layout-cols-tablet": Math.min(columns, COLUMN_BASE_RESPONSIVE_CAPS.tablet),
    "--layout-cols-desktop": Math.min(columns, COLUMN_BASE_RESPONSIVE_CAPS.desktop),
  } as CSSProperties;
}
