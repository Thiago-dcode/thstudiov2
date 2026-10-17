"use client";

import type { Media } from "@repo/common-lib/types/media";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { VideoCoverPicker } from "@repo/ui/components/custom/video-cover-picker";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { updateMediaThumbnailTimeApi } from "../api/media-api.client";

/**
 * Picks a new cover for a finished video by scrubbing the stored video itself.
 *
 * Saving only QUEUES the change: the worker extracts the frame, moderates it and notifies, so
 * `onQueued` is the caller's cue to wait for that notification rather than a sign it is done.
 */
export function ChangeVideoCoverDialog({
  media,
  open,
  onOpenChange,
  onQueued,
}: {
  media: Pick<Media, "id" | "url" | "thumbnail_time_seconds">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQueued: (seconds: number) => void;
}) {
  const t = useTranslations("atelier.media.card");
  const [picked, setPicked] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Each opening starts from what is saved, not from an earlier pick that was never used.
  useEffect(() => {
    if (open) setPicked(null);
  }, [open]);

  const handleSave = async () => {
    if (picked === null || !media.id) return;
    setIsSaving(true);
    const result = await updateMediaThumbnailTimeApi(media.id, {
      thumbnail_time_seconds: picked,
    });
    setIsSaving(false);
    if (!result.data) {
      toast.error(result.errors?.[0] ?? t("coverChangeFailed"));
      return;
    }
    onQueued(picked);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isSaving && onOpenChange(next)}
    >
      <DialogContent className="z-100 w-full max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-sm!">{t("coverTitle")}</DialogTitle>
          <DialogDescription className="text-xs! text-text-muted">
            {t("coverHint")}
          </DialogDescription>
        </DialogHeader>

        {media.url && (
          <VideoCoverPicker
            src={media.url}
            value={picked ?? media.thumbnail_time_seconds}
            defaultSeconds={MediaHelper.videoFrameEdgeOffsetSeconds}
            onCommit={setPicked}
            disabled={isSaving}
            sliderLabel={t("coverSliderLabel")}
            videoLabel={t("coverVideoLabel")}
            unsupportedLabel={t("coverUnsupported")}
          />
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={isSaving || picked === null}
          >
            {isSaving ? <Spinner /> : t("coverSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
