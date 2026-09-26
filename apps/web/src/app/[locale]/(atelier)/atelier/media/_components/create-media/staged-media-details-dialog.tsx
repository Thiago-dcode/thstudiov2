"use client";

import { DEFAULT_COMPRESSION_LVL } from "@repo/common-lib/constants/enums";
import { bytesToMB } from "@repo/common-lib/utils/bytes";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import { Sparkles, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import FormComponent from "@/lib/components/form-component";
import { LocationAutocomplete } from "@/modules/locations/components/location-autocomplete";
import { featureToLocationInput } from "@/modules/locations/location-input";
import {
  type UploadMedia,
  useMedia,
} from "@/modules/media/providers/media.provider";
import { MEDIA_TITLE_MAX } from "@/modules/media/schemas/media-shemas";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { CompressionSliderWithUpgradeHint } from "./compression-slider";
import {
  creditCostOf,
  creditsSpentBy,
  stagedFileName,
} from "./staged-media.utils";
import { StagedMediaPreview } from "./staged-media-preview";

/**
 * Per-file settings for one staged upload, opened by clicking its card.
 *
 * Title, description and location go out with the create request and are stored on the media;
 * the AI metadata job also reads them as context. Compression and the AI toggle override the bulk
 * settings for this file alone. Every field writes straight into the staged input via
 * `patchInput`, so there is no draft to lose however the dialog is closed.
 */
export function StagedMediaDetailsDialog({
  media,
  index,
  isPossibleDuplicate = false,
  onOpenChange,
}: {
  /** `null` closes the dialog — the caller resolves it from live state every render, so a file
   *  that gets removed or sent while open takes its dialog down with it. */
  media: UploadMedia | null;
  index: number;
  /** Another pending upload has the same file name and size. */
  isPossibleDuplicate?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("atelier.media.upload");
  const { mediaStagedToCreate, upsertMediaUpload } = useMedia();
  const { metrics, aiCreditsInfo } = useUserMetrics();
  const allowCompression = metrics?.active_plan.allow_media_compression;

  const fileName = media
    ? stagedFileName(media, t("previewAlt", { index: index + 1 }))
    : "";
  const compressionLevel =
    media?.input.compression_level || DEFAULT_COMPRESSION_LVL;
  const sizeMb = media?.input.file ? bytesToMB(media.input.file.size) : null;
  const isVideo = !!media?.input.file?.type.startsWith("video/");

  const cost = media ? creditCostOf(media, aiCreditsInfo) : 0;
  // What the *other* staged files have already claimed. Excluding this one is what lets an
  // already-enabled file stay enabled instead of being judged unaffordable against its own cost.
  const spentByOthers = media
    ? creditsSpentBy(mediaStagedToCreate, aiCreditsInfo, media.unique_id)
    : 0;
  const generateMetadata = !!media?.input.generate_metadata;
  const canAffordMetadata = spentByOthers + cost <= aiCreditsInfo.remaining;
  const checkboxId = `generate-seo-${media?.unique_id ?? "none"}`;

  const patchInput = (patch: Partial<UploadMedia["input"]>) => {
    if (!media) return;
    upsertMediaUpload({ ...media, input: { ...media.input, ...patch } });
  };

  return (
    <Dialog open={!!media} onOpenChange={onOpenChange}>
      <DialogContent className="z-[110] flex max-h-[90dvh] w-full flex-col gap-0 p-0 phone-lg:max-w-lg tablet:max-w-3xl tablet-lg:max-w-4xl">
        <DialogHeader className="border-b px-6 pb-4 pt-6 text-left">
          <DialogTitle className="truncate text-sm!" title={fileName}>
            {fileName}
          </DialogTitle>
          <DialogDescription className="text-xs! text-text-muted">
            {t("detailsSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {isPossibleDuplicate && (
            <div
              role="status"
              className="flex items-start gap-2 border border-warning px-3 py-2.5 text-xs text-warning"
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{t("duplicateDialogHint")}</span>
            </div>
          )}
          {/* Two columns from `tablet` up: the work on the left, what you say about it on the right —
              so the added width shortens the dialog instead of just enlarging the preview. */}
          <div className="grid gap-6 tablet:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] tablet:items-start">
            {media && (
              <div className="space-y-3 tablet:sticky tablet:top-0">
                <div className="flex aspect-video w-full items-center justify-center overflow-hidden border border-border bg-fg-2 tablet:aspect-square">
                  <StagedMediaPreview media={media} index={index} />
                </div>
                <dl className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <dt className="text-text-muted">{t("fileTypeLabel")}</dt>
                    <dd className="font-medium text-text">
                      {isVideo ? t("typeVideo") : t("typeImage")}
                    </dd>
                  </div>
                  {sizeMb !== null && (
                    <div className="space-y-0.5">
                      <dt className="text-text-muted">{t("fileSizeLabel")}</dt>
                      <dd className="font-medium text-text">
                        {sizeMb.toFixed(1)} MB
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="space-y-6">
              {/* Top of the right column: what the work is matters more than how it is stored. Written
              straight into the staged input, so closing the dialog any way keeps what was typed. */}
              <section className="space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm! font-medium text-text">
                    {t("aboutTitle")}
                  </h3>
                  <span className="block text-xs text-text-muted">
                    {t("aboutHint")}
                  </span>
                </div>
                <FormComponent.LabelInput
                  id={`staged-title-${media?.unique_id ?? "none"}`}
                  name="title"
                  label={t("titleLabel")}
                  labelClassName="text-xs font-medium text-text"
                  value={media?.input.title ?? ""}
                  onChange={(e) => patchInput({ title: e.target.value })}
                  placeholder={t("titlePlaceholder")}
                  maxLength={MEDIA_TITLE_MAX}
                  autoComplete="off"
                />
                <FormComponent.LabelTextarea
                  id={`staged-description-${media?.unique_id ?? "none"}`}
                  name="description"
                  label={t("descriptionLabel")}
                  labelClassName="text-xs font-medium text-text"
                  value={media?.input.description ?? ""}
                  onChange={(e) => patchInput({ description: e.target.value })}
                  placeholder={t("descriptionPlaceholder")}
                  rows={4}
                />
                <div className="space-y-1">
                  <LocationAutocomplete
                    id={`staged-location-${media?.unique_id ?? "none"}`}
                    label={t("locationLabel")}
                    labelClassName="text-xs font-medium text-text"
                    placeholder={t("locationPlaceholder")}
                    selectedLabel={media?.input.location?.formatted}
                    onSelect={(feature) => {
                      // An unusable pick is ignored — it must never read as "clear".
                      const location = featureToLocationInput(feature);
                      if (location) patchInput({ location });
                    }}
                    onClear={() => patchInput({ location: null })}
                    // Above this dialog's z-[110], or the suggestions open behind it.
                    positionerClassName="z-[120]"
                  />
                  <span className="block text-xs text-text-muted">
                    {t("locationHint")}
                  </span>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text">
                    {t("compressionLabel")}
                  </span>
                  <span className="bg-fg-1 px-2 py-1 text-xs font-semibold text-text">
                    {compressionLevel}
                  </span>
                </div>
                <CompressionSliderWithUpgradeHint
                  compressionLevel={compressionLevel}
                  disabled={!allowCompression}
                  upgradeHint={t("upgradeToAdjust")}
                  onCompressionLevelChange={(compressionLvlSelected) =>
                    patchInput({ compression_level: compressionLvlSelected })
                  }
                />
              </section>

              <section
                className={cn(
                  "flex items-start gap-3 border p-3 transition-colors",
                  generateMetadata
                    ? "border-border-em bg-fg-1"
                    : "border-border bg-fg hover:border-border-em",
                  !generateMetadata && !canAffordMetadata && "opacity-60",
                )}
              >
                <Checkbox
                  id={checkboxId}
                  className="mt-0.5 size-5 shrink-0"
                  checked={generateMetadata}
                  disabled={!generateMetadata && !canAffordMetadata}
                  onCheckedChange={(checked) =>
                    patchInput({ generate_metadata: checked === true })
                  }
                />
                <label
                  htmlFor={checkboxId}
                  className="flex min-w-0 flex-1 cursor-pointer select-none flex-col gap-1"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-text">
                    <Sparkles className="size-4 shrink-0" aria-hidden />
                    {t("aiSeoGeneration")}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t("aiSeoHint")}
                  </span>
                  <span className="text-xs text-text-muted">
                    {!generateMetadata && !canAffordMetadata
                      ? t("notEnoughCreditsForFile")
                      : t("aiCostForFile", { count: cost })}
                  </span>
                </label>
              </section>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-4 tablet:justify-end">
          <Button
            variant="primary"
            className="w-full tablet:w-auto tablet:min-w-40"
            onClick={() => onOpenChange(false)}
          >
            {t("detailsDone")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
