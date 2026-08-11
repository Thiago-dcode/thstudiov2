"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@repo/ui/components/shadcn/hover-card";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { ChevronDownIcon, CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { type UploadMedia, useMedia } from "../providers/media.provider";

export const UploadMediaModal = () => {
  const t = useTranslations("atelier.media.uploadStatus");
  const tCommon = useTranslations("atelier.common");
  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);
  const { mediaUploads, isCompleted, isLoading, handleRemoveCompleted } =
    useMedia();

  useEffect(() => {
    setMounted(true);
  }, []);

  // While a batch is uploading, also surface queued items (limited by the
  // upload concurrency) so the modal reflects the whole batch, not just the
  // few requests currently in-flight.
  const mediaUploadsToDisplay = useMemo(
    () =>
      mediaUploads.filter(
        (m) => m.pending || m.data || m.error || m.deleted || isLoading,
      ),
    [mediaUploads, isLoading],
  );
  const remainingLength = useMemo(
    () =>
      mediaUploadsToDisplay.filter((m) => !m.data && !m.error && !m.deleted)
        .length,
    [mediaUploadsToDisplay],
  );
  const successCount = useMemo(
    () => mediaUploadsToDisplay.filter((m) => m.data).length,
    [mediaUploadsToDisplay],
  );
  const failedCount = useMemo(
    () => mediaUploadsToDisplay.filter((m) => m.error).length,
    [mediaUploadsToDisplay],
  );

  const overallState = useMemo(() => {
    if (!isCompleted) return "loading";
    if (failedCount === 0) return "success";
    if (successCount === 0) return "error";
    return "mixed";
  }, [isCompleted, failedCount, successCount]);

  if (!mounted || !mediaUploadsToDisplay.length) return null;

  const overallIcon =
    overallState === "loading" ? (
      <Spinner className="size-6 text-blue-500" />
    ) : overallState === "success" ? (
      <CircleCheckIcon className="size-6 text-green-500" />
    ) : overallState === "mixed" ? (
      <OctagonXIcon className="size-6 text-yellow-500" />
    ) : (
      <OctagonXIcon className="size-6 text-red-500" />
    );

  if (compact) {
    return (
      <button
        type="button"
        className=" z-200 pointer-events-auto w-14 h-14 flex flex-col items-center justify-center border border-border bg-fg shadow-lg cursor-pointer hover:bg-fg-1 transition-colors"
        onClick={() => setCompact(false)}
        aria-label="Expand upload status"
      >
        {overallIcon}
        <span className="text-[9px] text-text-muted mt-0.5 leading-none tabular-nums">
          {mediaUploadsToDisplay.length}
        </span>
      </button>
    );
  }

  return (
    <div className=" z-200 pointer-events-auto max-w-80 w-full max-h-[400px] flex flex-col overflow-hidden border border-border bg-fg shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm! font-semibold">
            {isCompleted ? t("uploadComplete") : t("uploadingFiles")}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {remainingLength > 0 && (
              <span>{t("remaining", { count: remainingLength })}</span>
            )}
            {successCount > 0 && (
              <span className="text-green-600 text-xs!">
                {successCount} {t("success")}
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-red-600">
                {failedCount} {t("failed")}
              </span>
            )}
            {isCompleted &&
              remainingLength === 0 &&
              successCount > 0 &&
              failedCount === 0 && (
                <span className="text-green-600">{t("allComplete")}</span>
              )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setCompact(true);
          }}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-start justify-start gap-3 px-4 py-4">
          {mediaUploadsToDisplay.map((mediaUpload) => (
            <SingleMediaUpload
              key={`media-uploading-${mediaUpload.unique_id}`}
              mediaUpload={mediaUpload}
            />
          ))}
        </div>
      </div>
      {isCompleted && (
        <div className="border-t border-border px-4 py-3 shrink-0">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveCompleted();
            }}
          >
            {tCommon("close")}
          </Button>
        </div>
      )}
    </div>
  );
};

const SingleMediaUpload = ({ mediaUpload }: { mediaUpload: UploadMedia }) => {
  const t = useTranslations("atelier.media.uploadStatus");
  const tCommon = useTranslations("atelier.common");
  const isQueued =
    !mediaUpload.pending &&
    !mediaUpload.data &&
    !mediaUpload.error &&
    !mediaUpload.deleted;

  const statusIcon = mediaUpload.pending ? (
    <Spinner className="size-5 text-blue-500" />
  ) : mediaUpload.data ? (
    <CircleCheckIcon className="size-5 text-green-500" />
  ) : mediaUpload.error ? (
    <OctagonXIcon className="size-5 text-red-500" />
  ) : isQueued ? (
    <Spinner className="size-5 text-text-muted" />
  ) : null;

  const statusText = useMemo(() => {
    if (isQueued) {
      return t("queued");
    }

    if (mediaUpload.pending) {
      switch (mediaUpload.action) {
        case "create":
          return t("uploading");
        case "edit":
          return t("updating");
        case "seo":
          return t("generatingSeo");
        case "delete":
          return t("deleting");
      }
    }

    if (mediaUpload.data || mediaUpload.deleted) {
      switch (mediaUpload.action) {
        case "create":
          return t("uploaded");
        case "edit":
          return t("updated");
        case "seo":
          return t("seoGenerated");
        case "delete":
          return t("deleted");
      }
    }

    if (mediaUpload.error) {
      return mediaUpload.error.errors?.join(", ") || t("failedFallback");
    }

    return "";
  }, [mediaUpload, isQueued, t]);

  const errorMessages = mediaUpload.error?.errors || [];
  const inputErrors = mediaUpload.error?.inputErrors || {};
  const hasErrors =
    errorMessages.length > 0 || Object.keys(inputErrors).length > 0;
  if (!mediaUpload.previewUrl)
    return (
      <div className="flex items-center gap-3 p-2">
        <Spinner className="size-8" />
        <div className="flex-1 min-w-0">
          <p className="text-xs! font-normal truncate">
            {mediaUpload.input.file?.name || tCommon("loading")}
          </p>
          <p className="text-xs text-text-muted">{t("preparingUpload")}</p>
        </div>
      </div>
    );

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-3 p-2 hover:bg-fg-2 transition-colors cursor-pointer">
          <div className="relative aspect-square w-16 shrink-0 overflow-hidden border border-border bg-fg-2">
            {mediaUpload.previewUrl ? (
              <img
                src={mediaUpload.previewUrl}
                alt={t("previewAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted text-xs">
                {t("noPreview")}
              </div>
            )}
            {statusIcon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                {statusIcon}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm! font-medium truncate">
              {mediaUpload.input.file?.name ||
                mediaUpload.input.seo_title ||
                t("unknownFile")}
            </p>
            <p className="text-xs! text-text-muted">{statusText}</p>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="start"
        collisionPadding={16}
        className="z-210 w-64"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {statusIcon}
            <p className="text-sm font-medium">{statusText}</p>
          </div>
          {hasErrors && (
            <div className="space-y-1.5">
              {errorMessages.length > 0 && (
                <div className="space-y-1">
                  {errorMessages.map((error, index) => (
                    <p key={index} className="text-xs text-red-500">
                      {error}
                    </p>
                  ))}
                </div>
              )}
              {Object.keys(inputErrors).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(inputErrors).map(([field, error]) => (
                    <p key={field} className="text-xs text-red-500">
                      <span className="font-medium">{field}:</span> {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          {mediaUpload.input.file && (
            <p className="text-xs text-text-muted">
              {mediaUpload.input.file.name}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
