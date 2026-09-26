"use client";

import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { Slider } from "@repo/ui/components/shadcn/slider";
import { useEffect, useRef, useState } from "react";

export const COMPRESSION_LVLS = ENUMS.COMPRESSION_LEVEL;

export function getCompressionLvlIndex(
  compressionLvl: EnumType<"COMPRESSION_LEVEL">,
) {
  for (let i = 0; i < COMPRESSION_LVLS.length; i++) {
    if (compressionLvl === COMPRESSION_LVLS[i]) {
      return i;
    }
  }
  return COMPRESSION_LVLS.length - 2;
}

export function CompressionSlider({
  compressionLevel,
  disabled,
  onCompressionLevelChange,
  onPreviewChange,
}: {
  compressionLevel: EnumType<"COMPRESSION_LEVEL">;
  disabled?: boolean;
  onCompressionLevelChange: (level: EnumType<"COMPRESSION_LEVEL">) => void;
  onPreviewChange?: (level: EnumType<"COMPRESSION_LEVEL">) => void;
}) {
  const committedIndex = getCompressionLvlIndex(compressionLevel);
  const [sliderIndex, setSliderIndex] = useState(committedIndex);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setSliderIndex(committedIndex);
    }
  }, [committedIndex]);

  return (
    <Slider
      value={[sliderIndex]}
      max={COMPRESSION_LVLS.length - 1}
      min={0}
      step={1}
      disabled={disabled}
      onPointerDown={() => {
        isDraggingRef.current = true;
      }}
      onValueChange={(values) => {
        if (disabled) return;
        const next = values[0];
        if (next === undefined) return;
        setSliderIndex(next);
        const preview = COMPRESSION_LVLS[next];
        if (preview) onPreviewChange?.(preview);
      }}
      onValueCommit={(values) => {
        isDraggingRef.current = false;
        if (disabled) return;
        const next = values[0];
        if (next === undefined) return;
        const compressionLvlSelected = COMPRESSION_LVLS[next];
        if (!compressionLvlSelected) return;
        onCompressionLevelChange(compressionLvlSelected);
      }}
    />
  );
}

export function CompressionSliderWithUpgradeHint({
  compressionLevel,
  disabled,
  upgradeHint,
  onCompressionLevelChange,
  onPreviewChange,
}: {
  compressionLevel: EnumType<"COMPRESSION_LEVEL">;
  disabled?: boolean;
  upgradeHint: string;
  onCompressionLevelChange: (level: EnumType<"COMPRESSION_LEVEL">) => void;
  onPreviewChange?: (level: EnumType<"COMPRESSION_LEVEL">) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!disabled) {
    return (
      <CompressionSlider
        compressionLevel={compressionLevel}
        onCompressionLevelChange={onCompressionLevelChange}
        onPreviewChange={onPreviewChange}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="w-full cursor-not-allowed"
          onMouseLeave={() => setOpen(false)}
        >
          <CompressionSlider
            compressionLevel={compressionLevel}
            disabled
            onCompressionLevelChange={onCompressionLevelChange}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-auto p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="text-xs! text-amber-600">{upgradeHint}</p>
      </PopoverContent>
    </Popover>
  );
}
