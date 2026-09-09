"use client";

/**
 * PUTs a file straight to S3 against a presigned URL from `mediaClientService.createUploadUrl`.
 *
 * `XMLHttpRequest`, not `fetch`: `fetch`'s `ReadableStream` request body has no standard upload
 * progress event, and a multi-hundred-MB video with no progress feedback is exactly the kind of
 * silence that makes a user reload the page mid-upload. `xhr.upload.onprogress` is the only
 * standard API that reports bytes sent for a request this large.
 *
 * The two headers are not incidental — they are literally what the presigned URL signed
 * (`S3StorageService.getUploadUrl`). Sending anything else, or omitting either, changes the
 * request enough that S3's signature check rejects it with a 403 before looking at the body:
 * - `Content-Type: application/octet-stream` — fixed by the signer, not `file.type`. The
 *   object's real, served `Content-Type` is decided later, when the API claims this upload and
 *   derives it from the destination key (`S3StorageService.move`), never from anything sent here.
 * - `x-amz-tagging: temp=true` — the header form of the `Tagging` the URL was signed with. A
 *   bucket lifecycle rule filtered on this tag is what expires an abandoned upload; the object
 *   otherwise sits under a per-user `__TEMP__` prefix a plain prefix-based rule cannot target.
 */
export type StorageUploadResult = { ok: true } | { ok: false; error: string };

export const uploadFileToStorage = (
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<StorageUploadResult> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("x-amz-tagging", "temp=true");

    if (onProgress) {
      // `onprogress` fires far more often than the rounded percent actually changes, and each
      // call is a React state write one layer up (`MediaProvider`). Tracking the last emitted
      // value caps a whole upload at 100 updates instead of one per network chunk.
      let lastPercent = -1;
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        if (percent === lastPercent) return;
        lastPercent = percent;
        onProgress(percent);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true });
        return;
      }
      resolve({
        ok: false,
        error: `Upload failed with status ${xhr.status}`,
      });
    };

    // Covers connection drops and CORS rejections alike — both surface here, not in `onload`.
    xhr.onerror = () => {
      resolve({ ok: false, error: "Network error while uploading the file" });
    };
    xhr.onabort = () => {
      resolve({ ok: false, error: "Upload was aborted" });
    };

    xhr.send(file);
  });
};
