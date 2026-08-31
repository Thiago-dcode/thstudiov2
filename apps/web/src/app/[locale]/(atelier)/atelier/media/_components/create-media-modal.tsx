"use client";

import {
  DEFAULT_COMPRESSION_LVL,
  ENUMS,
  type EnumType,
} from "@repo/common-lib/constants/enums";
import { ALLOWED_FILE_TYPES } from "@repo/common-lib/constants/limits";
import type { CreateMediaInputWithFile } from "@repo/common-lib/types/media";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { Slider } from "@repo/ui/components/shadcn/slider";
import { useInputFile } from "@repo/ui/contexts/file.provider";
import { cn } from "@repo/ui/lib/utils";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useMedia } from "@/modules/media/providers/media.provider";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";

const MAX_FILES = 10;
const COMPRESSION_LVLS = ENUMS.COMPRESSION_LEVEL;

function getCompressionLvlIndex(compressionLvl: EnumType<"COMPRESSION_LEVEL">) {
  for (let i = 0; i < COMPRESSION_LVLS.length; i++) {
    if (compressionLvl === COMPRESSION_LVLS[i]) {
      return i;
    }
  }
  return COMPRESSION_LVLS.length - 2;
}

function CompressionSlider({
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

function CompressionSliderWithUpgradeHint({
  compressionLevel,
  disabled,
  upgradeHint,
  onCompressionLevelChange,
}: {
  compressionLevel: EnumType<"COMPRESSION_LEVEL">;
  disabled?: boolean;
  upgradeHint: string;
  onCompressionLevelChange: (level: EnumType<"COMPRESSION_LEVEL">) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!disabled) {
    return (
      <CompressionSlider
        compressionLevel={compressionLevel}
        onCompressionLevelChange={onCompressionLevelChange}
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

/**
 * Files already sent leave the staging grid, so without this the dialog looks like nothing
 * happened — the same silence that made a second upload feel broken.
 */
function UploadingIndicator({ count }: { count: number }) {
  const t = useTranslations("atelier.media.upload");
  if (count <= 0) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs! text-text-muted">
      <Loader2 className="size-3 animate-spin shrink-0" aria-hidden />
      {t("uploadingInBackground", { count })}
    </span>
  );
}

function MediaUploadContent() {
  const t = useTranslations("atelier.media.upload");
  const tRoot = useTranslations();
  const [error, setError] = useState<string>();
  const [globalCompressionLevel, setGlobalCompressionLevel] = useState<
    EnumType<"COMPRESSION_LEVEL">
  >(DEFAULT_COMPRESSION_LVL);
  const [globalCompressionPreview, setGlobalCompressionPreview] =
    useState<EnumType<"COMPRESSION_LEVEL"> | null>(null);
  const {
    mediaPendingToCreate,
    mediaStagedToCreate,
    updateStagedCreateInputs,
    upsertMediaUpload,
    removeMediaUpload,
  } = useMedia();
  const { metrics, aiCreditsInfo } = useUserMetrics();
  const { errors: fileErrors, maxFileSizeBytes } = useInputFile();
  const allow_media_compression = metrics?.active_plan.allow_media_compression;
  // The limit applies to what is still being staged. Files already sent have left this dialog's
  // hands, so counting them here would lock the picker for the length of a background upload.
  const currentCount = mediaStagedToCreate.length;
  const isMaxReached = currentCount >= MAX_FILES;
  const uploadingCount = useMemo(
    () => mediaPendingToCreate.filter((m) => m.pending).length,
    [mediaPendingToCreate],
  );
  const willGenerateMetadata = useMemo(
    () =>
      mediaStagedToCreate.reduce(
        (prev, curr) => (curr.input.generate_metadata ? prev + 1 : prev),
        0,
      ),
    [mediaStagedToCreate],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) {
      setError(undefined);
      return;
    }

    // `FileInput` truncates the selection to what fits and hands us the untruncated one, so this
    // explains what was left out rather than rejecting anything — the files that fit are already in.
    const remainingSlots = MAX_FILES - currentCount;
    if (selectedFiles.length > remainingSlots) {
      setError(
        t("maxFilesError", { max: MAX_FILES, remaining: remainingSlots }),
      );
      return;
    }

    setError(undefined);
  };

  // The provider rejects the whole selection when any file is invalid, so surface every reason
  // here — otherwise nothing appears in the grid and the user has no idea why.
  const messages = useMemo(() => {
    const list = (fileErrors ?? []).map(({ code, fileName }) =>
      code === "too_large"
        ? tRoot("validation.file.tooLarge", {
            field: fileName,
            mb: Math.floor((maxFileSizeBytes ?? 0) / (1024 * 1024)),
          })
        : tRoot("validation.file.invalidType", { field: fileName }),
    );
    if (error) list.unshift(error);
    return list;
  }, [fileErrors, maxFileSizeBytes, error, tRoot]);

  const errorList = messages.length ? (
    <div className="mb-2 space-y-0.5">
      {messages.map((message) => (
        <p key={message} className="text-sm! text-red-500">
          {message}
        </p>
      ))}
    </div>
  ) : null;

  return (
    <div className="h-full flex flex-col p-2">
      {mediaStagedToCreate.length > 0 ? (
        <>
          <div className="mb-4 space-y-3 p-1 border border-border bg-fg/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs! font-medium text-text">
                      {t("globalCompression")}
                    </span>
                    <InfoTooltip
                      content={
                        <div className="space-y-2">
                          {!allow_media_compression && (
                            <div className="">
                              <p className="text-xs! text-amber-600">
                                <span className="font-medium!">
                                  {t("upgradeRequired")}
                                </span>
                              </p>
                            </div>
                          )}
                          <p className="font-medium! text-sm!">
                            {t("compressionTooltipTitle")}
                          </p>
                          <p className="text-sm!">
                            {t("compressionTooltipBody")}
                          </p>
                          <p className="text-xs! text-text-muted">
                            {t("compressionTooltipHint")}
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <span className="text-xs font-semibold text-text bg-fg px-2 py-1">
                    {globalCompressionPreview ?? globalCompressionLevel}
                  </span>
                </div>

                <CompressionSlider
                  compressionLevel={globalCompressionLevel}
                  disabled={!allow_media_compression}
                  onPreviewChange={setGlobalCompressionPreview}
                  onCompressionLevelChange={(compressionLvlSelected) => {
                    setGlobalCompressionPreview(null);
                    setGlobalCompressionLevel(compressionLvlSelected);
                    updateStagedCreateInputs(() => ({
                      compression_level: compressionLvlSelected,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-border/50">
              <div
                className={cn(
                  "flex items-start gap-3 border p-3 transition-colors",
                  willGenerateMetadata > 0
                    ? "border-border-em bg-fg-1"
                    : "border-border bg-fg hover:border-border-em",
                  !aiCreditsInfo.hasCredits && "opacity-60",
                )}
              >
                <Checkbox
                  id="generate-seo"
                  className="mt-0.5 size-5"
                  checked={willGenerateMetadata > 0}
                  disabled={!aiCreditsInfo.hasCredits}
                  onCheckedChange={(checked) => {
                    const value = checked === true;
                    updateStagedCreateInputs((_, i) => ({
                      generate_metadata: value && i < aiCreditsInfo.remaining,
                    }));
                  }}
                />
                <label
                  htmlFor="generate-seo"
                  className="flex min-w-0 flex-1 cursor-pointer select-none flex-col gap-0.5"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                    <Sparkles className="size-4 shrink-0" />
                    {t("aiSeoGeneration")}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t("aiSeoHint")}
                  </span>
                </label>
                <div className="flex shrink-0 items-center gap-1 pt-0.5">
                  <span
                    className={cn(
                      "text-xs",
                      aiCreditsInfo.remaining - willGenerateMetadata <= 0
                        ? "text-accent"
                        : "text-text-muted",
                    )}
                  >
                    {willGenerateMetadata > 0
                      ? t("creditsUsageSummary", {
                          used: willGenerateMetadata,
                          remaining:
                            aiCreditsInfo.remaining - willGenerateMetadata,
                        })
                      : t("creditsLabel", { count: aiCreditsInfo.remaining })}
                  </span>
                  <InfoTooltip
                    content={
                      <div className="space-y-2">
                        {!aiCreditsInfo.hasCredits && (
                          <p className="text-xs! text-amber-600">
                            <span className="font-medium!">
                              {t("noCreditsTitle")}
                            </span>
                          </p>
                        )}
                        <p className="font-medium">{t("aiSeoGeneration")}</p>
                        <p className="text-sm!">{t("aiSeoTooltipBody")}</p>
                        <p className="text-xs! text-text-muted">
                          {t.rich("aiSeoCreditsHint", {
                            count: aiCreditsInfo.remaining,
                            remaining: (chunks) => (
                              <span className="font-semibold text-text">
                                {chunks}
                              </span>
                            ),
                          })}
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              <span className="text-sm! text-text-muted">
                {t("filesCount", { count: currentCount, max: MAX_FILES })}
              </span>
              <span className="flex items-center gap-3">
                <UploadingIndicator count={uploadingCount} />
                {isMaxReached && (
                  <span className="text-xs text-amber-600">
                    {t("maxReached")}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="mb-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaStagedToCreate.map((media, index) => {
                const currentCompressionLvl =
                  media.input.compression_level || DEFAULT_COMPRESSION_LVL;

                return (
                  <div
                    key={`media-upload-${media.input.file?.name}-${index}`}
                    className="flex flex-col gap-3"
                  >
                    <div className="relative aspect-square flex flex-col items-center justify-center overflow-hidden border border-border bg-fg-2 shadow-md min-h-[200px]">
                      {media.input.generate_metadata && (
                        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 bg-black/60 text-white px-1.5 py-0.5 text-[10px] font-medium">
                          <Sparkles className="h-3 w-3" />
                          {t("aiSeoBadge")}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMediaUpload(media.unique_id)}
                        className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <img
                        src={media.previewUrl}
                        alt={t("previewAlt", { index: index + 1 })}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col  px-1 gap-2">
                      <div className="flex items-start justify-start gap-1">
                        <span className="text-xs! text-text-muted font-medium">
                          {t("compressionLabel")}
                        </span>
                        <span className="text-xs! font-normal lowercase text-text bg-fg">
                          {currentCompressionLvl}
                        </span>
                      </div>
                      <CompressionSliderWithUpgradeHint
                        compressionLevel={currentCompressionLvl}
                        disabled={!allow_media_compression}
                        upgradeHint={t("upgradeToAdjust")}
                        onCompressionLevelChange={(compressionLvlSelected) => {
                          upsertMediaUpload({
                            ...media,
                            input: {
                              ...media.input,
                              compression_level: compressionLvlSelected,
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {errorList}
          <div className="mt-auto">
            <FileInput
              multiple
              onChange={handleFileChange}
              accept={ALLOWED_FILE_TYPES.join(",")}
              disabled={isMaxReached}
              currentFiles={currentCount}
              maxFiles={MAX_FILES}
              className="py-2 gap-1 min-h-0 [&_svg]:h-5 [&_svg]:w-5"
            />
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm! text-text-muted">
              {t("filesCount", { count: currentCount, max: MAX_FILES })}
            </span>
            <UploadingIndicator count={uploadingCount} />
          </div>
          {errorList}
          <div className="flex-1 min-h-0">
            <FileInput
              multiple
              onChange={handleFileChange}
              accept={ALLOWED_IMAGE_FILE_TYPES.join(",")}
              className="h-full [&>div]:h-full [&_label]:h-full [&_label]:min-h-0"
              disabled={isMaxReached}
              currentFiles={currentCount}
              maxFiles={MAX_FILES}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateMediaDialog({
  openFromQuery = false,
}: {
  /** When true, `?open=1` opens this dialog (and clears the query). */
  openFromQuery?: boolean;
}) {
  const t = useTranslations("atelier.media.upload");
  const router = useRouter();
  const searchParams = useSearchParams();
  const openParam = searchParams.get("open");
  const [open, setOpen] = useState(false);
  const {
    handleUploadInserts,
    handleRemoveCompleted,
    addMediaUploads,
    mediaStagedToCreate,
  } = useMedia();
  const { files } = useInputFile();
  const { session } = useSession();
  const { metrics } = useUserMetrics();

  const storageUsed = metrics?.extra_data.storage_used_mb ?? 0;
  const storageLimit = metrics?.active_plan.storage_limit_mb ?? 0;
  const isStorageFull = storageLimit > 0 && storageUsed >= storageLimit;

  const addedFilesRef = useRef(new Set<File>());

  useEffect(() => {
    if (!openFromQuery || openParam !== "1") return;
    setOpen(true);
    router.replace("/atelier/media");
  }, [openFromQuery, openParam, router]);

  // Previews are minted here rather than taken from `usePreviewUrls`, because a preview outlives
  // the selection that produced it: once a file is handed to the provider its card stays on screen
  // while it uploads, and picking a second batch replaces `files` — which had `usePreviewUrls`
  // revoke the first batch's URLs out from under the cards still rendering them. The provider is
  // now the sole owner and revokes in `removeMediaUpload` / `handleRemoveCompleted`.
  useEffect(() => {
    if (!files?.length || !session) return;

    const newMediaUploads: (CreateMediaInputWithFile & {
      previewUrl?: string;
    })[] = [];

    for (const file of Array.from(files)) {
      if (addedFilesRef.current.has(file)) continue;
      addedFilesRef.current.add(file);
      newMediaUploads.push({
        file,
        previewUrl: URL.createObjectURL(file),
        user_id: session.id,
      });
    }

    if (newMediaUploads.length > 0) {
      addMediaUploads(newMediaUploads);
    }
  }, [files, session, addMediaUploads]);

  if (!session) return null;

  if (isStorageFull) {
    return (
      <Button
        className="p-2 text-sm!"
        variant="default"
        size="default"
        disabled
        title={t("storageFullTitle", {
          used: (storageUsed / 1024).toFixed(1),
          limit: (storageLimit / 1024).toFixed(1),
        })}
      >
        <Plus className="h-4 w-4" />
        {t("createMedia")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs! " variant="default" size="sm">
          <Plus className="h-4 w-4" />
          {t("upload")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[100vw] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[98vh] h-full  flex flex-col justify-between [&>button]:hidden p-0 z-100">
        <DialogHeader className="border-b pb-4 px-6 pt-6">
          <DialogTitle className="text-sm!">{t("createNewMedia")}</DialogTitle>
          <DialogDescription className="text-xs!">
            {t("uploadUpToImages", { max: MAX_FILES })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <MediaUploadContent />
        </div>
        <DialogFooter className="border-t p-2 full flex flex-row gap-2">
          {/* Driven by what is actually stageable, not by `files` — that only tracks the last
              selection, so the button lingered after every card had been removed or sent and did
              nothing when clicked. */}
          {mediaStagedToCreate.length > 0 ? (
            <Button
              onClick={async () => {
                setOpen(false);
                await handleUploadInserts();
              }}
              variant={"primary"}
              className="w-full"
            >
              {t("uploadButton", { count: mediaStagedToCreate.length })}
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button
              onClick={() => {
                handleRemoveCompleted();
                setOpen(false);
              }}
              variant="destructive"
              size={"sm"}
              className="w-full max-w-32"
            >
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
