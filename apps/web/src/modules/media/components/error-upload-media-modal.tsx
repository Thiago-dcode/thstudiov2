"use client";

import type { ReturnError } from "@repo/common-lib/types/response";
import { Button } from "@repo/ui/components/shadcn/button";
import { OctagonXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UploadMedia, useMedia } from "../providers/media.provider";

const requestErrorLines = (
  error: ReturnError<Record<string, string>>,
): string[] => {
  const fromErrors = error.errors?.filter(Boolean) ?? [];
  const fromInputs = Object.values(error.inputErrors ?? {}).filter(
    (message): message is string => typeof message === "string" && !!message,
  );
  return fromErrors.length ? fromErrors : fromInputs;
};

const RequestErrorRow = ({ mediaUpload }: { mediaUpload: UploadMedia }) => {
  const t = useTranslations("atelier.media.uploadStatus");
  const lines = mediaUpload.error
    ? requestErrorLines(mediaUpload.error)
    : [t("failedFallback")];
  const title =
    mediaUpload.input.file?.name ||
    mediaUpload.input.seo_title ||
    t("unknownFile");

  return (
    <div className="flex items-start gap-3 p-2">
      <div className="relative size-12 shrink-0 overflow-hidden border border-border bg-fg-2">
        {mediaUpload.previewUrl ? (
          <img
            src={mediaUpload.previewUrl}
            alt={t("previewAlt")}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <OctagonXIcon className="size-4 text-error" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium truncate">{title}</p>
        {lines.map((line) => (
          <p key={line} className="text-xs text-error">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};

export const ErrorUploadMediaModal = () => {
  const t = useTranslations("atelier.media.uploadStatus");
  const tCommon = useTranslations("atelier.common");
  const { mediaRequestFailed, removeMediaUpload } = useMedia();

  if (!mediaRequestFailed.length) return null;

  const dismissRequestErrors = () => {
    for (const upload of mediaRequestFailed) {
      removeMediaUpload(upload.unique_id);
    }
  };

  return (
    <div className="z-200 pointer-events-auto max-w-80 w-full max-h-100 flex flex-col overflow-hidden border border-border bg-fg shadow-lg">
      <div className="flex items-start gap-3 border-b border-border px-4 py-3 shrink-0">
        <OctagonXIcon
          className="size-5 text-error shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{t("requestFailed")}</h3>
          <p className="text-xs text-text-muted">
            {t("requestFailedCount", { count: mediaRequestFailed.length })}
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-1 px-2 py-2">
          {mediaRequestFailed.map((mediaUpload) => (
            <RequestErrorRow
              key={`media-request-error-${mediaUpload.unique_id}`}
              mediaUpload={mediaUpload}
            />
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 shrink-0">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={dismissRequestErrors}
        >
          {tCommon("close")}
        </Button>
      </div>
    </div>
  );
};
