import type { ImageProps } from "next/image";

export type IconName =
  | "arrow"
  | "brain"
  | "cloud"
  | "crown"
  | "gift"
  | "hands"
  | "leaf"
  | "moon"
  | "star"
  | "sunflower"
  | "tower";

export type IconSize = "xs" | "sm" | "lg";

export const SIZE_CLASSES: Record<IconSize, string> = {
  xs: "size-5",
  sm: "size-8",
  lg: "size-16",
};

const ICON_NAMES = new Set<string>([
  "arrow",
  "brain",
  "cloud",
  "crown",
  "gift",
  "hands",
  "leaf",
  "moon",
  "star",
  "sunflower",
  "tower",
]);

export function isIconName(name: string): name is IconName {
  return ICON_NAMES.has(name);
}

export function getIconAlt(name: IconName, alt?: string) {
  return alt ?? `${name.charAt(0).toUpperCase()}${name.slice(1)} icon`;
}

export type CustomIconProps = {
  name: IconName;
  size?: IconSize;
} & Omit<ImageProps, "src">;
