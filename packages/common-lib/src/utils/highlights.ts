export function getEffectiveHighlightCount(
  highlightCount: number,
  originallyHighlighted: boolean,
  isCurrentlyHighlighted: boolean,
): number {
  if (originallyHighlighted === isCurrentlyHighlighted) {
    return highlightCount;
  }

  if (originallyHighlighted && !isCurrentlyHighlighted) {
    return highlightCount - 1;
  }

  return highlightCount + 1;
}

export function isHighlightToggleDisabled(
  highlightCount: number,
  highlightLimit: number,
  isCurrentlyHighlighted: boolean,
  originallyHighlighted = false,
): boolean {
  const effectiveCount = getEffectiveHighlightCount(
    highlightCount,
    originallyHighlighted,
    isCurrentlyHighlighted,
  );

  return effectiveCount >= highlightLimit && !isCurrentlyHighlighted;
}
