"use client";

import { cn } from "@repo/ui/lib/utils";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import {
  type CustomIconProps,
  getIconAlt,
  isIconName,
  SIZE_CLASSES,
} from "./custom-icon.shared";

export type { CustomIconProps, IconName, IconSize } from "./custom-icon.shared";
export { isIconName } from "./custom-icon.shared";

export function CustomIconClient({
  name,
  size = "sm",
  alt,
  className,
  ...imageProps
}: CustomIconProps) {
  const [src, setSrc] = useState<StaticImageData | null>(null);

  useEffect(() => {
    if (!isIconName(name)) {
      setSrc(null);
      return;
    }

    let cancelled = false;

    void import(`@/assets/icons/custom/${name}.png`).then((mod) => {
      if (!cancelled) setSrc(mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!src) return null;

  return (
    <Image
      src={src}
      alt={getIconAlt(name, alt)}
      className={cn("object-contain", SIZE_CLASSES[size], className)}
      {...imageProps}
    />
  );
}
