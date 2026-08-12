import { ENUMS, EnumType } from '../constants/enums';

export const DEFAULT_ASPECT_RATIO: EnumType<'ASPECT_RATIO'> = '1:1';

export type AspectRatioBucket = 'ultra-wide' | 'wide' | 'square' | 'tall' | 'ultra-tall';

const ASPECT_RATIO_BUCKET_MAP: Record<EnumType<'ASPECT_RATIO'>, AspectRatioBucket> = {
  '21:9': 'ultra-wide',
  '16:9': 'ultra-wide',
  '3:2':  'wide',
  '4:3':  'wide',
  '5:4':  'wide',
  '1:1':  'square',
  '4:5':  'tall',
  '3:4':  'tall',
  '2:3':  'ultra-tall',
  '9:16': 'ultra-tall',
};

export function aspectRatioToBucket(value: EnumType<'ASPECT_RATIO'>): AspectRatioBucket {
  return ASPECT_RATIO_BUCKET_MAP[value] ?? 'square';
}

const ASPECT_RATIO_VALUES: Record<EnumType<'ASPECT_RATIO'>, number> = {
  '1:1': 1,
  '5:4': 5 / 4,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '21:9': 21 / 9,
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '2:3': 2 / 3,
  '9:16': 9 / 16,
};

export function resolveAspectRatio(
  width: number,
  height: number,
): EnumType<'ASPECT_RATIO'> {
  if (width <= 0 || height <= 0) {
    return DEFAULT_ASPECT_RATIO;
  }

  const actualLog = Math.log(width / height);

  let closest: EnumType<'ASPECT_RATIO'> = DEFAULT_ASPECT_RATIO;
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const ratio of ENUMS.ASPECT_RATIO) {
    const distance = Math.abs(Math.log(ASPECT_RATIO_VALUES[ratio]) - actualLog);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closest = ratio;
    }
  }

  return closest;
}

export function aspectRatioToCss(value: EnumType<'ASPECT_RATIO'>): string {
  const [w, h] = value.split(':');
  return `${w} / ${h}`;
}

/**
 * Nominal pixel dimensions for an aspect ratio, scaled so the long edge is `longEdge`.
 *
 * `next/image` needs concrete `width`/`height` to reserve the layout box and build a srcset. We
 * never store the real pixel size, but the ratio is enough: CSS still governs the rendered size,
 * and the declared pair only has to have the correct proportions to prevent layout shift.
 */
export function aspectRatioToPixels(
  value: EnumType<'ASPECT_RATIO'>,
  longEdge = 1600,
): { width: number; height: number } {
  const ratio = ASPECT_RATIO_VALUES[value] ?? 1;
  return ratio >= 1
    ? { width: longEdge, height: Math.round(longEdge / ratio) }
    : { width: Math.round(longEdge * ratio), height: longEdge };
}
