import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import {
  getIconAlt,
  isIconName,
  SIZE_CLASSES,
  type CustomIconProps,
} from "./custom-icon.shared";

export type { IconName, IconSize, CustomIconProps } from "./custom-icon.shared";
export { isIconName } from "./custom-icon.shared";

export async function CustomIcon({
  name,
  size = "sm",
  alt,
  className,
  ...imageProps
}: CustomIconProps) {
  if (!isIconName(name)) return null;

  const { default: src } = await import(`@/assets/icons/custom/${name}.png`);

  return (
    <Image
      src={src}
      alt={getIconAlt(name, alt)}
      className={cn("object-contain", SIZE_CLASSES[size], className)}
      {...imageProps}
    />
  );
}
