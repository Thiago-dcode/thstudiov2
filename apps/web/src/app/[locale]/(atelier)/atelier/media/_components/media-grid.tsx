"use client";

import { ALLOWED_FILE_TYPES } from "@repo/common-lib/constants/limits";
import type { Media } from "@repo/common-lib/types/media";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { FileInputProvider } from "@repo/ui/contexts/file.provider";
import { cn } from "@repo/ui/lib/utils";
import { Brain, ImageOff, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useMedia } from "@/modules/media/providers/media.provider";
import {
  SelectableMedia,
  useSelectMedia,
} from "@/modules/media/providers/select-media.provider";
import { useSubscribeToUserNotification } from "@/modules/user-notifications/hooks/useSubscribeToUserNotification";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { CreateMediaDialog } from "./create-media-modal";
import { EditMediaCard } from "./edit-media-card";

type MediaGridProps = {
  media: Media[];
  username: string;
  hasActiveFilters: boolean;
};

export function MediaGrid({
  media,
  username,
  hasActiveFilters,
}: MediaGridProps) {
  const t = useTranslations("atelier.media.grid");
  const [currentMedia, setCurrentMedia] = useState(media);
  const {
    mediaPendingToUpdate,
    handleUploadUpdates,
    isLoading,
    generateManySeoMedia,
    isMediaLoading,
  } = useMedia();

  useEffect(() => {
    setCurrentMedia(media);
  }, [media]);
  const {
    canSelect,
    selectedMedia,
    selectionCount,
    setCanSelect,
    clearSelection,
  } = useSelectMedia();
  const { aiCreditsInfo } = useUserMetrics();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerateSeoDialogOpen, setIsGenerateSeoDialogOpen] = useState(false);
  const MAX_AI_GENERATE = 10;
  const creditsAvailable = aiCreditsInfo.remaining;
  const creditsNeeded = selectionCount;
  const hasEnoughCredits = creditsAvailable >= creditsNeeded;
  const isOverAiLimit = selectionCount > MAX_AI_GENERATE;

  const handleConfirmUpdate = async () => {
    setIsDialogOpen(false);
    await handleUploadUpdates();
  };

  const handleGenerateSeo = async () => {
    setIsGenerateSeoDialogOpen(false);
    clearSelection();
    setCanSelect(false);
    await generateManySeoMedia(Object.values(selectedMedia));
  };

  const handleRemoveCurrentMedia = (mediaId: number) => {
    setCurrentMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const upsertCurrentMedia = (payload: Media) => {
    setCurrentMedia((prev) => {
      const existIndex = prev.findIndex((m) => m.id === payload.id);
      if (existIndex === -1) {
        return [payload, ...prev];
      }
      const next = [...prev];
      next[existIndex] = payload;
      return next;
    });
  };

  useSubscribeToUserNotification({
    callbackId: "media-grid",
    createUpdateMediaCallback: upsertCurrentMedia,
    generateMetadataMediaCallback: upsertCurrentMedia,
    onDeleteMediaCallback: ({ id }) => handleRemoveCurrentMedia(id),
  });

  const pendingCount = mediaPendingToUpdate.length;

  return (
    <>
      <div className="relative flex flex-col w-full h-full gap-2">
        <div className="self-end">
          <FileInputProvider
            allowedMimeTypes={ALLOWED_FILE_TYPES}
            // Per-type: a video may be 300MB where an image may not, and one flat number
            // would either reject legitimate video or wave through an enormous PNG.
            maxFileSizeBytesFor={(file) =>
              MediaHelper.maxUploadBytes(file.type)
            }
          >
            <CreateMediaDialog openFromQuery />
          </FileInputProvider>
        </div>
        {currentMedia.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2  top-0  bg-bg py-1 w-full",
              canSelect ? "justify-between" : "justify-start",
            )}
          >
            {canSelect ? (
              <Dialog
                open={isGenerateSeoDialogOpen}
                onOpenChange={setIsGenerateSeoDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={!selectionCount}
                    className="shrink-0 transition-colors duration-200"
                  >
                    <Brain className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs! font-medium whitespace-nowrap">
                      {selectionCount
                        ? t("generateSeoCount", { count: selectionCount })
                        : t("generateSeoTitle")}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md z-100">
                  <DialogHeader>
                    <DialogTitle className="text-lg!">
                      {t("generateSeoTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-sm!">
                      {t("generateSeoDescription", { count: selectionCount })}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="px-6 py-3 bg-fg-2/50 space-y-1">
                    <div className="flex items-center justify-between text-sm!">
                      <span className="text-text-muted">
                        {t("creditsAvailable")}
                      </span>
                      <span className="font-medium">{creditsAvailable}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm!">
                      <span className="text-text-muted">
                        {t("creditsNeeded")}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          !hasEnoughCredits && "text-error",
                        )}
                      >
                        {creditsNeeded}
                      </span>
                    </div>
                    {isOverAiLimit && (
                      <p className="text-xs! text-error mt-2">
                        {t("overAiLimit", {
                          max: MAX_AI_GENERATE,
                          excess: selectionCount - MAX_AI_GENERATE,
                        })}
                      </p>
                    )}
                    {!hasEnoughCredits && (
                      <p className="text-xs! text-error mt-2">
                        {t("insufficientCredits", {
                          needed: creditsNeeded - creditsAvailable,
                        })}
                      </p>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGenerateSeoDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!hasEnoughCredits || isOverAiLimit}
                      onClick={async () => {
                        await handleGenerateSeo();
                      }}
                    >
                      {t("generateSeoTitle")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setCanSelect(true)}
              >
                {t("selectMedia")}
              </Button>
            )}
            {canSelect ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  setCanSelect(false);
                  clearSelection();
                }}
              >
                {t("cancelSelection")}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
            <ImageOff className="h-10 w-10 stroke-[1.5]" />
            <p className="text-sm">
              {hasActiveFilters ? t("noMediaFiltered") : t("noMediaEmpty")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-start w-full">
          {currentMedia.map((item) => {
            if (
              !canSelect ||
              item.status !== "COMPLETED" ||
              isMediaLoading(item)
            ) {
              return (
                <EditMediaCard
                  key={`media-card-${item.id}`}
                  media={item}
                  username={username}
                />
              );
            }
            return (
              <SelectableMedia key={`media-selectable-${item.id}`} media={item}>
                <EditMediaCard
                  key={item.id}
                  media={item}
                  username={username}
                />{" "}
              </SelectableMedia>
            );
          })}
        </div>
      </div>

      {pendingCount > 0 && !isLoading && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="primary"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow relative"
          >
            <Upload className="h-4 w-4" />
            <span>{t("updateItems", { count: pendingCount })}</span>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center">
              {pendingCount}
            </span>
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[300px]">
          <DialogHeader>
            <DialogTitle>{t("confirmUpdatesTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirmUpdatesDescription", { count: pendingCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size={"sm"}
              className=""
              onClick={() => setIsDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await handleConfirmUpdate();
              }}
            >
              {t("updateAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
