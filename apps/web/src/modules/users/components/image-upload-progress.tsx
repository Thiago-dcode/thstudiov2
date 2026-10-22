"use client";

import { useTranslations } from "next-intl";
import type { UserImageUploadStatus } from "../api/update-user-with-images.client";

/**
 * Feedback for an avatar/banner submit: a real percent while the file goes to S3, then an
 * indeterminate bar while the API converts and moderates it. Renders nothing otherwise.
 */
export const ImageUploadProgress = ({
  status,
}: {
  status: UserImageUploadStatus | null;
}) => {
  const t = useTranslations("editUser.upload");
  if (!status) return null;

  const uploading = status.phase === "uploading";
  const label = uploading
    ? t("uploading", { percent: status.percent })
    : t("processing");

  return (
    <div role="status" className="flex w-full max-w-xs flex-col gap-2">
      <p className="text-sm text-text-muted">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={uploading ? status.percent : undefined}
        className="h-1 w-full overflow-hidden bg-fg-2"
      >
        <div
          className={`h-full bg-primary transition-all${uploading ? "" : " animate-pulse"}`}
          style={{ width: uploading ? `${status.percent}%` : "100%" }}
        />
      </div>
    </div>
  );
};
