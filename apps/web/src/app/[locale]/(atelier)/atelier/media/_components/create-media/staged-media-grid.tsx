"use client";

import {
  ALLOWED_FILE_TYPES,
  MAX_IMAGE_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB,
} from "@repo/common-lib/constants/limits";
import {
  dropFilesIntoInput,
  FileInput,
  useDragEndReset,
} from "@repo/ui/components/custom/file-input";
import { useInputFile } from "@repo/ui/contexts/file.provider";
import { ImagePlus, MousePointerClick, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  // The whole pane takes drops, not just the dropzone: once cards fill it, the "add more" strip is
  // a small target, and a file dropped a few pixels off it used to be opened by the browser.
  const inputRef = useRef<HTMLInputElement>(null);
  const internalDrag = useRef(false);
  const [isPaneDragging, setIsPaneDragging] = useState(false);
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

  // Only files coming from outside the page. Dragging one of the page's own images (a staged
  // preview) can carry the "Files" type in Chromium, and must not open the overlay or re-add it.
  const isFileDrag = (e: DragEvent) =>
    !internalDrag.current &&
    Array.from(e.dataTransfer?.types ?? []).includes("Files");

  const resetPaneDrag = useCallback(() => setIsPaneDragging(false), []);
  // Backstop: any drag that ends anywhere (dropped elsewhere, Esc, left the window) clears it.
  useDragEndReset(resetPaneDrag);
  useEffect(() => {
    const start = () => {
      internalDrag.current = true;
    };
    const end = () => {
      internalDrag.current = false;
    };
    window.addEventListener("dragstart", start);
    window.addEventListener("dragend", end);
    return () => {
      window.removeEventListener("dragstart", start);
      window.removeEventListener("dragend", end);
    };
  }, []);

  const paneDragHandlers = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setIsPaneDragging(true);
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      // Always accept, even when full: the drop handler then says why nothing was added (a
      // refused drop never fires `drop`, so the user got no feedback at all).
      e.dataTransfer.dropEffect = "copy";
    },
    // No enter/leave counter: the cards can change under the pointer and swallow a `dragleave`.
    // Only hide when the pointer really left the pane (Safari reports no `relatedTarget`; the
    // next `dragenter` on a child turns it straight back on).
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      setIsPaneDragging(false);
    },
    // Drops on the dropzone itself are handled by `FileInput` (which marks them handled); this
    // only clears the overlay for those, and adds the files for drops anywhere else on the pane.
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      if (!isFileDrag(e)) return;
      setIsPaneDragging(false);
      if (e.isDefaultPrevented()) return;
      e.preventDefault();
      if (isMaxReached) {
        setError(t("maxFilesError", { max: MAX_FILES, remaining: 0 }));
        return;
      }
      dropFilesIntoInput(inputRef.current, e.dataTransfer.files);
    },
  };

  // Shown over the pane while files are dragged anywhere on it.
  const dropOverlay = isPaneDragging ? (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-text bg-bg/85 backdrop-blur-xs"
    >
      <ImagePlus className="size-8 text-text" />
      <p className="text-sm! font-medium text-text">
        {isMaxReached
          ? t("dropOverlayFull", { max: MAX_FILES })
          : t("dropOverlayTitle")}
      </p>
      {!isMaxReached ? (
        <p className="text-xs! text-text-muted">
          {t("dropzoneRemaining", { remaining: MAX_FILES - currentCount })}
        </p>
      ) : null}
    </div>
  ) : null;

  // The provider keeps the valid files of a mixed selection and reports the rest, so name every
  // file that was left out and why — otherwise it just silently goes missing from the grid.
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
    <div role="alert" className="space-y-0.5">
      {messages.map((message) => (
        <p key={message} className="text-sm! text-error">
          {message}
        </p>
      ))}
    </div>
  ) : null;

  if (currentCount === 0) {
    return (
      <div
        className="relative flex h-full min-h-0 flex-col gap-2"
        {...paneDragHandlers}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm! text-text-muted">
            {t("filesCount", { count: currentCount, max: MAX_FILES })}
          </span>
          <UploadingIndicator count={uploadingCount} />
        </div>
        {errorList}
        <div className="min-h-0 flex-1">
          <FileInput
            ref={inputRef}
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
                <p className="mt-3 text-xs! text-text-muted">
                  {t("dropzoneFormats", {
                    imageMb: MAX_IMAGE_UPLOAD_MB,
                    videoMb: MAX_VIDEO_UPLOAD_MB,
                  })}
                </p>
              </>
            }
            dragLabelContent={
              <p className="text-sm! font-medium text-text">
                {t("dropOverlayTitle")}
              </p>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-col gap-4"
      {...paneDragHandlers}
    >
      {dropOverlay}
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
        ref={inputRef}
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
        dragLabelContent={
          <p className="text-sm! font-medium text-text">
            {t("dropOverlayTitle")}
          </p>
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
