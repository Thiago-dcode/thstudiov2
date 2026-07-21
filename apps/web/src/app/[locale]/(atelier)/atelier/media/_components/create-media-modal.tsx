"use client";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import {
  DEFAULT_COMPRESSION_LVL,
  ENUMS,
  type EnumType,
} from "@repo/common-lib/constants/enums";
import type {
  CreateMediaInputWithFile,
  Media,
} from "@repo/common-lib/types/media";
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
import { Slider } from "@repo/ui/components/shadcn/slider";
import { useInputFile } from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { Plus, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
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

function MediaUploadContent() {
  const t = useTranslations("atelier.media.upload");
  const [error, setError] = useState<string>();
  const [globalCompressionLevel, setGlobalCompressionLevel] = useState<
    EnumType<"COMPRESSION_LEVEL">
  >(DEFAULT_COMPRESSION_LVL);
  const [globalCompressionPreview, setGlobalCompressionPreview] =
    useState<EnumType<"COMPRESSION_LEVEL"> | null>(null);
  const {
    mediaPendingToCreate,
    upsertMediaUpload,
    removeMediaUpload,
    setMediaUploads,
  } = useMedia();
  const { metrics, aiCreditsInfo } = useUserMetrics();
  const allow_media_compression = metrics?.active_plan.allow_media_compression;
  const currentCount = mediaPendingToCreate?.length || 0;
  const isMaxReached = currentCount >= MAX_FILES;
  const mediaToShow = useMemo(
    () => mediaPendingToCreate.filter((m) => !m.pending && !m.data && !m.error),
    [mediaPendingToCreate],
  );

  const [generateSeo, setGenerateSeo] = useState(false);
  const remainingCredits = aiCreditsInfo
    ? aiCreditsInfo.total - aiCreditsInfo.consumed
    : 0;
  const hasCredits = remainingCredits > 0;

  useEffect(() => {
    const needsUpdate = mediaToShow.some((m) => m.generate_seo !== generateSeo);
    if (!needsUpdate) return;
    setMediaUploads(
      mediaPendingToCreate.map((mu) => ({
        ...mu,
        generate_seo: generateSeo,
      })),
    );
  }, [
    generateSeo,
    mediaPendingToCreate.map,
    mediaToShow.some,
    setMediaUploads,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) {
      setError(undefined);
      return;
    }

    const remainingSlots = MAX_FILES - currentCount;
    if (selectedFiles.length > remainingSlots) {
      setError(
        t("maxFilesError", { max: MAX_FILES, remaining: remainingSlots }),
      );
      e.target.value = "";
      return;
    }

    setError(undefined);
  };
  return (
    <div className="h-full flex flex-col p-2">
      {mediaToShow && mediaToShow.length > 0 ? (
        <>
          <div className="mb-4 space-y-3 p-1 border border-border bg-fg/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">
                      {t("globalCompression")}
                    </span>
                    <InfoTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">
                            {t("compressionTooltipTitle")}
                          </p>
                          <p className="text-sm">
                            {t("compressionTooltipBody")}
                          </p>
                          <p className="text-xs text-text-muted">
                            {t("compressionTooltipHint")}
                          </p>
                        </div>
                      }
                    />
                    <span className="text-xs text-text-muted bg-fg-2 px-2 py-0.5">
                      {t("allFiles")}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-text bg-fg px-2 py-1">
                    {globalCompressionPreview ?? globalCompressionLevel}
                  </span>
                </div>
                {!allow_media_compression && (
                  <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-600">
                      <span className="font-medium">
                        {t("upgradeRequired")}
                      </span>{" "}
                      {t("upgradeRequiredBody")}
                    </p>
                  </div>
                )}
                <CompressionSlider
                  compressionLevel={globalCompressionLevel}
                  disabled={!allow_media_compression}
                  onPreviewChange={setGlobalCompressionPreview}
                  onCompressionLevelChange={(compressionLvlSelected) => {
                    setGlobalCompressionPreview(null);
                    setGlobalCompressionLevel(compressionLvlSelected);
                    setMediaUploads(
                      mediaPendingToCreate.map((mu) => ({
                        ...mu,
                        input: {
                          ...mu.input,
                          compression_level: compressionLvlSelected,
                        },
                      })),
                    );
                  }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="generate-seo"
                    checked={generateSeo}
                    disabled={!hasCredits}
                    onCheckedChange={(checked) => {
                      const value = checked === true;
                      setGenerateSeo(value);
                      setMediaUploads(
                        mediaPendingToCreate.map((mu) => ({
                          ...mu,
                          generate_seo: value,
                        })),
                      );
                    }}
                  />
                  <label
                    htmlFor="generate-seo"
                    className="flex items-center gap-1.5 text-sm font-medium text-text cursor-pointer select-none"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("aiSeoGeneration")}
                  </label>
                  <InfoTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">{t("aiSeoGeneration")}</p>
                        <p className="text-sm">{t("aiSeoTooltipBody")}</p>
                        <p className="text-xs text-text-muted">
                          {t("aiSeoCreditsHint", { count: remainingCredits })}
                        </p>
                      </div>
                    }
                  />
                </div>
                <span className="text-xs font-semibold text-text bg-fg px-2 py-1">
                  {t("creditsLabel", { count: remainingCredits })}
                </span>
              </div>
              {!hasCredits && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-600">
                    <span className="font-medium">{t("noCreditsTitle")}</span>{" "}
                    {t("noCreditsBody")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm text-text-muted">
                {t("filesCount", { count: currentCount, max: MAX_FILES })}
              </span>
              {isMaxReached && (
                <span className="text-xs text-amber-600">
                  {t("maxReached")}
                </span>
              )}
            </div>
          </div>
          <div className="mb-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaPendingToCreate.map((media, index) => {
                const currentCompressionLvl =
                  media.input.compression_level || DEFAULT_COMPRESSION_LVL;

                return (
                  <div
                    key={`media-upload-${media.input.file?.name}-${index}`}
                    className="flex flex-col gap-3"
                  >
                    <div className="relative aspect-square flex flex-col items-center justify-center overflow-hidden border border-border bg-fg-2 shadow-md min-h-[200px]">
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
                      {!allow_media_compression && (
                        <p className="text-xs text-amber-600">
                          {t("upgradeToAdjust")}
                        </p>
                      )}
                      <CompressionSlider
                        compressionLevel={currentCompressionLvl}
                        disabled={!allow_media_compression}
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
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="mt-auto">
            <FileInput
              multiple
              onChange={handleFileChange}
              accept={ALLOWED_IMAGE_FILE_TYPES.join(",")}
              disabled={isMaxReached}
              currentFiles={currentCount}
              maxFiles={MAX_FILES}
              className="py-2 gap-1 min-h-0 [&_svg]:h-5 [&_svg]:w-5"
            />
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-text-muted">
              {t("filesCount", { count: currentCount, max: MAX_FILES })}
            </span>
          </div>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
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
  onSuccess,
}: {
  onSuccess?: (media: Media) => void;
}) {
  const t = useTranslations("atelier.media.upload");
  const [open, setOpen] = useState(false);
  const {
    handleUploadInserts,
    isLoading,
    handleRemoveCompleted,
    addMediaUploads,
  } = useMedia();
  const { files } = useInputFile();
  const { previewUrls, cleanup } = usePreviewUrls({ files });
  const { session } = useSession();
  const { metrics } = useUserMetrics();

  const storageUsed = metrics?.extra_data.storage_used_mb ?? 0;
  const storageLimit = metrics?.active_plan.storage_limit_mb ?? 0;
  const isStorageFull = storageLimit > 0 && storageUsed >= storageLimit;

  const addedFilesRef = useRef(new Set<File>());

  useEffect(() => {
    if (
      !previewUrls?.length ||
      !files?.length ||
      !session ||
      files.length !== previewUrls.length
    )
      return;

    const newMediaUploads: (CreateMediaInputWithFile & {
      previewUrl?: string;
    })[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (addedFilesRef.current.has(file)) continue;
      addedFilesRef.current.add(file);
      const previewUrl = previewUrls[i];
      newMediaUploads.push({
        file,
        previewUrl,
        seo_filename: file.name,
        user_id: session.id,
      });
    }

    if (newMediaUploads.length > 0) {
      addMediaUploads(newMediaUploads);
    }
  }, [previewUrls, files, session, addMediaUploads]);

  useEffect(() => {
    if (!isLoading) return;

    setOpen(false);
  }, [isLoading]);
  if (!session) return null;

  if (isStorageFull) {
    return (
      <Button
        className="p-2 text-sm"
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
    <Dialog open={open} onOpenChange={(next) => !isLoading && setOpen(next)}>
      <DialogTrigger asChild>
        <Button
          className="text-xs! "
          variant="default"
          size="sm"
          disabled={isLoading}
          title={isLoading ? t("uploadInProgress") : undefined}
        >
          <Plus className="h-4 w-4" />
          {t("addMedia")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl h-[95vh] flex flex-col justify-between [&>button]:hidden p-0 z-100">
        <DialogHeader className="border-b pb-4 px-6 pt-6">
          <DialogTitle className="text-lg!">
            {t("createNewMedia")}
          </DialogTitle>
          <DialogDescription className="text-sm!">
            {t("uploadUpToImages", { max: MAX_FILES })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <MediaUploadContent />
        </div>
        <DialogFooter className="border-t p-2 full flex flex-row gap-2">
          {files?.length ? (
            <Button
              onClick={async () => {
                setOpen(false);
                await handleUploadInserts(onSuccess);
              }}
              variant={"primary"}
              className="w-full"
            >
              {t("uploadButton")}
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button
              onClick={() => {
                handleRemoveCompleted();
                cleanup();
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
