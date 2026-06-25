"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@repo/ui/components/shadcn/hover-card";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { CircleCheckIcon, Eye, EyeOff, OctagonXIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type UploadMedia, useMedia } from "../providers/media.provider";

export const UploadMediaModal = () => {
  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);
  const { mediaUploads, isCompleted, handleRemoveCompleted } = useMedia();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pendingLength = useMemo(
    () => mediaUploads.filter((m) => m.pending).length,
    [mediaUploads],
  );
  const successCount = useMemo(
    () => mediaUploads.filter((m) => m.data).length,
    [mediaUploads],
  );
  const failedCount = useMemo(
    () => mediaUploads.filter((m) => m.error).length,
    [mediaUploads],
  );
  const mediaUploadsToDisplay = useMemo(
    () =>
      mediaUploads.filter((m) => m.pending || m.data || m.error || m.deleted),
    [mediaUploads],
  );

  if (!mounted || !mediaUploadsToDisplay.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-200 pointer-events-auto w-80 max-h-[400px] flex flex-col overflow-hidden border border-border bg-fg shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm! font-semibold">
            {isCompleted ? "Upload complete" : "Uploading files"}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {pendingLength > 0 && (
              <span>
                {pendingLength}{" "}
                {pendingLength === 1 ? "remaining" : "remaining"}
              </span>
            )}
            {successCount > 0 && (
              <span className="text-green-600 text-xs!">
                {successCount} {successCount === 1 ? "success" : "success"}
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-red-600">
                {failedCount} {failedCount === 1 ? "failed" : "failed"}
              </span>
            )}
            {isCompleted &&
              pendingLength === 0 &&
              successCount > 0 &&
              failedCount === 0 && (
                <span className="text-green-600">All complete</span>
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
            setCompact(!compact);
          }}
        >
          {compact ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out flex-1 min-h-0 ${
          compact ? "max-h-0 opacity-0" : "opacity-100"
        }`}
      >
        <div className="max-h-[400px] overflow-y-auto overscroll-contain">
          <div className=" h-f flex flex-col items-start justify-start gap-3 px-4 pt-4 pb-40 ">
            {mediaUploadsToDisplay.map((mediaUpload) => (
              <SingleMediaUpload
                key={`media-uploading-${mediaUpload.unique_id}`}
                mediaUpload={mediaUpload}
              />
            ))}
          </div>
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
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

const SingleMediaUpload = ({ mediaUpload }: { mediaUpload: UploadMedia }) => {
  const statusIcon = mediaUpload.pending ? (
    <Spinner className="size-5 text-blue-500" />
  ) : mediaUpload.data ? (
    <CircleCheckIcon className="size-5 text-green-500" />
  ) : mediaUpload.error ? (
    <OctagonXIcon className="size-5 text-red-500" />
  ) : null;

  const statusText = useMemo(() => {
    if (mediaUpload.pending) {
      switch (mediaUpload.action) {
        case "create":
          return "Uploading...";
        case "edit":
          return "Updating...";
        case "seo":
          return "Generating SEO...";
        case "delete":
          return "Deleting...";
      }
    }

    if (mediaUpload.data || mediaUpload.deleted) {
      switch (mediaUpload.action) {
        case "create":
          return "Uploaded";
        case "edit":
          return "Updated";
        case "seo":
          return "SEO generated";
        case "delete":
          return "Deleted";
      }
    }

    if (mediaUpload.error) {
      return mediaUpload.error.errors?.join(", ") || "Failed";
    }

    return "";
  }, [mediaUpload]);

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
            {mediaUpload.input.file?.name || "Loading..."}
          </p>
          <p className="text-xs text-text-muted">Preparing upload...</p>
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
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted text-xs">
                No preview
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
                "Unknown file"}
            </p>
            <p className="text-xs! text-text-muted">{statusText}</p>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
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
