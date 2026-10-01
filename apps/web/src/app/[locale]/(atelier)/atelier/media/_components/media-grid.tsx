"use client";

import {
  ALLOWED_FILE_TYPES,
  MAX_MEDIA_DELETE_BATCH,
  MAX_MEDIA_LOCATION_BATCH,
  MAX_MEDIA_METADATA_BATCH,
} from "@repo/common-lib/constants/limits";
import type { LocationInput } from "@repo/common-lib/types/location";
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
} from "@repo/ui/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { FileInputProvider } from "@repo/ui/contexts/file.provider";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "@repo/ui/sonner";
import {
  Brain,
  ChevronDown,
  ImageOff,
  MapPin,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocationAutocomplete } from "@/modules/locations/components/location-autocomplete";
import { featureToLocationInput } from "@/modules/locations/location-input";
import { useMedia } from "@/modules/media/providers/media.provider";
import {
  SelectableMedia,
  useSelectMedia,
} from "@/modules/media/providers/select-media.provider";
import { useSubscribeToUserNotification } from "@/modules/user-notifications/hooks/useSubscribeToUserNotification";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { CreateMediaDialog } from "./create-media/create-media-dialog";
import { EditMediaCard } from "./edit-media-card";

type MediaGridProps = {
  media: Media[];
  username: string;
  hasActiveFilters: boolean;
};

// Controlled so the dialogs can be opened from the actions dropdown, whose items
// unmount on close and so cannot host a DialogTrigger.
type BatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function GenerateManyMediaMetadataDialog({
  open: isGenerateSeoDialogOpen,
  onOpenChange: setIsGenerateSeoDialogOpen,
}: BatchDialogProps) {
  const t = useTranslations("atelier.media.grid");
  const { generateManySeoMedia } = useMedia();
  const { selectedMedia, selectionCount, setCanSelect, clearSelection } =
    useSelectMedia();
  const { aiCreditsInfo } = useUserMetrics();
  // A batch is still capped at MAX_MEDIA_METADATA_BATCH items, but the credits it costs
  // depend on the mix of images and videos in the selection, so this sums weighted
  // cost rather than counting items.
  const creditsAvailable = aiCreditsInfo.remaining;
  const creditsNeeded = Object.values(selectedMedia).reduce(
    (sum, media) => sum + aiCreditsInfo.costFor(media.media_type),
    0,
  );
  const hasEnoughCredits = creditsAvailable >= creditsNeeded;
  const isOverAiLimit = selectionCount > MAX_MEDIA_METADATA_BATCH;

  const handleGenerateSeo = async () => {
    const media = Object.values(selectedMedia);
    setIsGenerateSeoDialogOpen(false);
    clearSelection();
    setCanSelect(false);
    await generateManySeoMedia(media);
  };

  return (
    <Dialog
      open={isGenerateSeoDialogOpen}
      onOpenChange={setIsGenerateSeoDialogOpen}
    >
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
            <span className="text-text-muted">{t("creditsAvailable")}</span>
            <span className="font-medium">{creditsAvailable}</span>
          </div>
          <div className="flex items-center justify-between text-sm!">
            <span className="text-text-muted">{t("creditsNeeded")}</span>
            <span
              className={cn("font-medium", !hasEnoughCredits && "text-error")}
            >
              {creditsNeeded}
            </span>
          </div>
          {isOverAiLimit && (
            <p className="text-xs! text-error mt-2">
              {t("overAiLimit", {
                max: MAX_MEDIA_METADATA_BATCH,
                excess: selectionCount - MAX_MEDIA_METADATA_BATCH,
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
            onClick={handleGenerateSeo}
          >
            {t("generateSeoTitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdateManyMediaLocationsDialog({
  open,
  onOpenChange,
}: BatchDialogProps) {
  const t = useTranslations("atelier.media.grid");
  const { updateManyMediaLocation } = useMedia();
  const { selectedMedia, selectionCount, setCanSelect, clearSelection } =
    useSelectMedia();
  const [location, setLocation] = useState<LocationInput | null>(null);
  const isOverLimit = selectionCount > MAX_MEDIA_LOCATION_BATCH;

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setLocation(null);
  };

  const handleApply = async () => {
    if (!location || isOverLimit) return;
    const media = Object.values(selectedMedia);
    handleOpenChange(false);
    clearSelection();
    setCanSelect(false);
    await updateManyMediaLocation({ location, media });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md z-100">
        <DialogHeader>
          <DialogTitle className="text-lg!">
            {t("updateLocationTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm!">
            {t("updateLocationDescription", { count: selectionCount })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 py-3">
          <LocationAutocomplete
            id="batch-media-location"
            label={t("updateLocationTitle")}
            labelClassName="text-sm font-medium text-text"
            placeholder={t("locationPlaceholder")}
            selectedLabel={location?.formatted}
            onSelect={(feature) => {
              const picked = featureToLocationInput(feature);
              if (picked) setLocation(picked);
            }}
            onClear={() => setLocation(null)}
            positionerClassName="z-[110]"
          />
          <span className="block text-xs leading-relaxed text-text-muted">
            {t("updateLocationHint")}
          </span>
          {isOverLimit && (
            <p className="text-xs! text-error">
              {t("overLocationLimit", {
                max: MAX_MEDIA_LOCATION_BATCH,
                excess: selectionCount - MAX_MEDIA_LOCATION_BATCH,
              })}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!location || isOverLimit}
            onClick={handleApply}
          >
            {t("updateLocationTitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteManyMediaDialog({ open, onOpenChange }: BatchDialogProps) {
  const t = useTranslations("atelier.media.grid");
  const { deleteManyMedia } = useMedia();
  const { selectedMedia, selectionCount, setCanSelect, clearSelection } =
    useSelectMedia();
  const [isDeleting, setIsDeleting] = useState(false);
  const isOverLimit = selectionCount > MAX_MEDIA_DELETE_BATCH;
  // Counts only exist on the owner's atelier list, which is where this grid gets its media.
  const selected = Object.values(selectedMedia);
  const inPortfolios = selected.filter(
    (media) => (media.portfolios_count ?? 0) > 0,
  ).length;
  const inCollections = selected.filter(
    (media) => (media.collections_count ?? 0) > 0,
  ).length;
  const inUse = selected.filter(
    (media) =>
      (media.portfolios_count ?? 0) > 0 || (media.collections_count ?? 0) > 0,
  ).length;

  const handleOpenChange = (next: boolean) => {
    // Closing mid-request would hide the only sign that the delete is still running.
    if (isDeleting) return;
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (isOverLimit || !selected.length) return;
    setIsDeleting(true);
    const result = await deleteManyMedia(selected);
    setIsDeleting(false);

    if (!result.data) {
      toast.error(result.errors?.[0] ?? t("deleteFailed"));
      return;
    }
    onOpenChange(false);
    clearSelection();
    setCanSelect(false);
    if (result.data.errors.length) {
      toast.error(
        t("deletePartialFailed", {
          failed: result.data.errors.length,
          total: selected.length,
        }),
      );
      return;
    }
    toast.success(t("deleteSuccess", { count: result.data.deleted.length }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md z-100">
        <DialogHeader>
          <DialogTitle className="text-lg!">{t("deleteTitle")}</DialogTitle>
          <DialogDescription className="text-sm!">
            {t("deleteDescription", { count: selectionCount })}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-3 bg-fg-2/50 space-y-2 text-sm!">
          {inUse > 0 && (
            <p className="text-error">
              {t("deleteInUse", {
                count: inUse,
                portfolios: inPortfolios,
                collections: inCollections,
              })}
            </p>
          )}
          <p className="text-text-muted">{t("deleteIrreversible")}</p>
          {isOverLimit && (
            <p className="text-xs! text-error">
              {t("overDeleteLimit", {
                max: MAX_MEDIA_DELETE_BATCH,
                excess: selectionCount - MAX_MEDIA_DELETE_BATCH,
              })}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => handleOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={isOverLimit || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting
              ? t("deleting")
              : t("deleteConfirm", { count: selectionCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type BatchDialog = "metadata" | "location" | "delete";

function BatchMediaActionsMenu() {
  const t = useTranslations("atelier.media.grid");
  const { selectionCount } = useSelectMedia();
  const [openDialog, setOpenDialog] = useState<BatchDialog | null>(null);

  const dialogProps = (dialog: BatchDialog): BatchDialogProps => ({
    open: openDialog === dialog,
    onOpenChange: (next) => setOpenDialog(next ? dialog : null),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!selectionCount}
            className="group shrink-0 transition-colors duration-200"
          >
            <span className="text-xs! font-medium whitespace-nowrap">
              {t("actions")}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="min-w-44">
          <DropdownMenuItem
            className="text-xs"
            onSelect={() => setOpenDialog("metadata")}
          >
            <Brain aria-hidden />
            {t("generateSeoCount", { count: selectionCount })}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs"
            onSelect={() => setOpenDialog("location")}
          >
            <MapPin aria-hidden />
            {t("updateLocationCount", { count: selectionCount })}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs text-error"
            onSelect={() => setOpenDialog("delete")}
          >
            <Trash2 aria-hidden />
            {t("deleteCount", { count: selectionCount })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <GenerateManyMediaMetadataDialog {...dialogProps("metadata")} />
      <UpdateManyMediaLocationsDialog {...dialogProps("location")} />
      <DeleteManyMediaDialog {...dialogProps("delete")} />
    </>
  );
}

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
    isMediaLoading,
  } = useMedia();

  useEffect(() => {
    setCurrentMedia(media);
  }, [media]);
  const { canSelect, setCanSelect, clearSelection } = useSelectMedia();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfirmUpdate = async () => {
    setIsDialogOpen(false);
    await handleUploadUpdates();
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
      <div className="relative flex flex-col w-full min-h-full gap-2">
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
              // Sticky so the selection actions stay reachable while scrolling.
              "sticky -top-4 phone-lg:-top-7 z-40 flex flex-wrap items-center gap-2 bg-bg/95 py-4 w-full",
              canSelect ? "justify-between" : "justify-start",
            )}
          >
            {canSelect ? (
              <BatchMediaActionsMenu />
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
