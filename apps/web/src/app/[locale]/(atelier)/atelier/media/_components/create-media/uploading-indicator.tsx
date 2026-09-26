"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Files already sent leave the staging grid, so without this the dialog looks like nothing
 * happened — the same silence that made a second upload feel broken.
 */
export function UploadingIndicator({ count }: { count: number }) {
  const t = useTranslations("atelier.media.upload");
  if (count <= 0) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs! text-text-muted">
      <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
      {t("uploadingInBackground", { count })}
    </span>
  );
}
