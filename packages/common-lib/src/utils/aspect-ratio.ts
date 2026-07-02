import { ENUMS, EnumType } from '../constants/enums';

export const DEFAULT_ASPECT_RATIO: EnumType<'ASPECT_RATIO'> = '1:1';

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
