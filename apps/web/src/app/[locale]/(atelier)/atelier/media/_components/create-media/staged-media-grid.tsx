"use client";

import { ALLOWED_FILE_TYPES } from "@repo/common-lib/constants/limits";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { useInputFile } from "@repo/ui/contexts/file.provider";
import { MousePointerClick, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useMedia } from "@/modules/media/providers/media.provider";
import { MAX_FILES, possibleDuplicateIds } from "./staged-media.utils";
import { StagedMediaCard } from "./staged-media-card";
import { StagedMediaDetailsDialog } from "./staged-media-details-dialog";
import { UploadingIndicator } from "./uploading-indicator";

/**
 * The files themselves: the grid of staged cards, the errors the last pick produced, and the
 * dropzone that adds more. Fills the left pane from `tablet-lg` up and the full width below it.
 */
export function StagedMediaGrid() {
  const t = useTranslations("atelier.media.upload");
  const tRoot = useTranslations();
  const [error, setError] = useState<string>();
  const [selectedUniqueId, setSelectedUniqueId] = useState<number | null>(null);
  const { mediaPendingToCreate, mediaStagedToCreate, removeMediaUpload } =
    useMedia();
  const { errors: fileErrors, maxFileSizeBytes } = useInputFile();

  // The limit applies to what is still being staged. Files already sent have left this dialog's
  // hands, so counting them here would lock the picker for the length of a background upload.
  const currentCount = mediaStagedToCreate.length;
  const isMaxReached = currentCount >= MAX_FILES;
  const uploadingCount = useMemo(
    () => mediaPendingToCreate.filter((m) => m.pending).length,
    [mediaPendingToCreate],
  );

  // Against everything still waiting on this tab — staged, queued or transferring — so a file
  // picked again while the first batch uploads is caught too. Nothing leaves memory.
  const duplicateIds = useMemo(
    () => possibleDuplicateIds(mediaPendingToCreate),
    [mediaPendingToCreate],
  );
  const stagedDuplicateCount = mediaStagedToCreate.filter((m) =>
    duplicateIds.has(m.unique_id),
  ).length;

  // Resolved from live state rather than held in state: a file that is removed or sent while
  // its dialog is open drops out of the list, and the dialog closes with it.
  const selectedIndex = mediaStagedToCreate.findIndex(
    (m) => m.unique_id === selectedUniqueId,
  );
  const selectedMedia =
    selectedIndex === -1 ? null : (mediaStagedToCreate[selectedIndex] ?? null);

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
    const list = (fileErrors ?? []).map(({ code, fileName, limitBytes }) =>
      code === "too_large"
        ? tRoot("validation.file.tooLarge", {
            field: fileName,
            // The cap is per-file (video is allowed far more than an image), so it comes off
            // the error rather than off a single provider-level number.
            mb: Math.floor(
              (limitBytes ?? maxFileSizeBytes ?? 0) / (1024 * 1024),
            ),
          })
        : tRoot("validation.file.invalidType", { field: fileName }),
    );
    if (error) list.unshift(error);
    return list;
  }, [fileErrors, maxFileSizeBytes, error, tRoot]);

  const errorList = messages.length ? (
    <div className="space-y-0.5">
      {messages.map((message) => (
        <p key={message} className="text-sm! text-red-500">
          {message}
        </p>
      ))}
    </div>
  ) : null;

  if (currentCount === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm! text-text-muted">
            {t("filesCount", { count: currentCount, max: MAX_FILES })}
          </span>
          <UploadingIndicator count={uploadingCount} />
        </div>
        {errorList}
        <div className="min-h-0 flex-1">
          <FileInput
            multiple
            onChange={handleFileChange}
            accept={ALLOWED_FILE_TYPES.join(",")}
            className="h-full [&>div]:h-full [&_label]:h-full [&_label]:min-h-0"
            disabled={isMaxReached}
            currentFiles={currentCount}
            maxFiles={MAX_FILES}
            labelContent={
              <>
                <p className="text-sm! font-medium text-text">
                  {t("dropzoneTitle")}
                </p>
                <p className="mt-1 text-xs! text-text-muted">
                  {t("dropzoneHint")}
                </p>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <MousePointerClick className="size-3.5 shrink-0" aria-hidden />
        {t("gridHint")}
      </span>
      {stagedDuplicateCount > 0 && (
        <span
          role="status"
          className="flex items-center gap-1.5 text-xs text-warning"
        >
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          {t("duplicateSummary", { count: stagedDuplicateCount })}
        </span>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 tablet-lg:grid-cols-3 laptop:grid-cols-4 desktop:grid-cols-5 desktop-lg:grid-cols-6">
          {mediaStagedToCreate.map((media, index) => (
            <StagedMediaCard
              key={media.unique_id}
              media={media}
              index={index}
              isPossibleDuplicate={duplicateIds.has(media.unique_id)}
              onOpenDetails={setSelectedUniqueId}
              onRemove={removeMediaUpload}
            />
          ))}
        </div>
      </div>

      {errorList}

      <FileInput
        multiple
        onChange={handleFileChange}
        accept={ALLOWED_FILE_TYPES.join(",")}
        disabled={isMaxReached}
        currentFiles={currentCount}
        maxFiles={MAX_FILES}
        className="min-h-0 gap-1 py-3 [&_svg]:h-5 [&_svg]:w-5"
        labelContent={
          <>
            <p className="text-sm! font-medium text-text">
              {t("dropzoneAddMore")}
            </p>
            <p className="mt-1 text-xs! text-text-muted">
              {t("dropzoneRemaining", { remaining: MAX_FILES - currentCount })}
            </p>
          </>
        }
      />

      <StagedMediaDetailsDialog
        media={selectedMedia}
        index={selectedIndex === -1 ? 0 : selectedIndex}
        isPossibleDuplicate={
          !!selectedMedia && duplicateIds.has(selectedMedia.unique_id)
        }
        onOpenChange={(open) => {
          if (!open) setSelectedUniqueId(null);
        }}
      />
    </div>
  );
}
