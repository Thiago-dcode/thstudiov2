"use client";

import { cn } from "@repo/ui/lib/utils";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export const FailedMediaOverlay = ({
  reason,
  className,
}: {
  reason?: string | null;
  className?: string;
}) => {
  const t = useTranslations("atelier.media.card");

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-bg/80 px-3 text-center",
        className,
      )}
    >
      <TriangleAlert className="size-4 text-error" aria-hidden />
      <p className="text-xs font-medium text-text">{t("failed")}</p>
      {reason ? (
        <p className="text-[11px] text-text-muted line-clamp-2">{reason}</p>
      ) : null}
    </div>
  );
};
