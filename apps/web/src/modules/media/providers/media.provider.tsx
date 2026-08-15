"use client";

import type {
  CreateMediaInputWithFile,
  Media,
  UpdateMediaInput,
} from "@repo/common-lib/types/media";
import type {
  ActionReturn,
  ReturnError,
} from "@repo/common-lib/types/response";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import {
  createMediaApi,
  generateMediaMetadataApi,
  updateMediaApi,
} from "../api/media-api.client";
import { deleteMediaAction } from "../server-actions/delete-media.action";
import {
  isTransientMediaUploadError,
  MEDIA_UPLOAD_CONCURRENCY,
  MEDIA_UPLOAD_MAX_RETRIES,
  MEDIA_UPLOAD_RETRY_BASE_DELAY_MS,
  runWithConcurrency,
  sleep,
} from "../utils/media-upload-concurrency";

// ============================================================================
// Types
// ============================================================================

type UploadMediaAction = "create" | "edit" | "seo" | "delete";
export type UploadMedia = {
  input: CreateMediaInputWithFile;
  action: UploadMediaAction;
  //If has id is an update
  id?: number;
  previewUrl?: string;
  pending: boolean;
  data?: Media;
  deleted?: boolean;
  unique_id: number;
  onSuccess?: (media: Media) => Promise<void>;
  error?: ReturnError<Record<string, string>>;
  generate_seo?: boolean;
};

type MediaContextType = {
  mediaUploads: UploadMedia[];
  addMediaUploads: (
    mediaInput: (CreateMediaInputWithFile & { previewUrl?: string })[],
  ) => void;
  pushMediaUpload: (mediaUpload: UploadMedia) => void;
  setMediaUploads: (mediaUploads: UploadMedia[]) => void;
  handleRemoveCompleted: () => void;
  handleUpload: () => Promise<void>;
  handleUploadUpdates: () => Promise<void>;
  handleUploadInserts: (onSuccess?: (media: Media) => void) => Promise<void>;
  upsertMediaUpload: (mediaUpload: UploadMedia) => void;
  removeMediaUpload: (uniqueId: number) => void;
  uploadSingleMedia: (
    uniqueId: number,
    onSuccess?: (media: Media) => void,
  ) => Promise<void>;
  generateSeoSingleMedia: (media: Media) => Promise<ActionReturn<Media>>;
  generateManySeoMedia: (media: Media[]) => Promise<void>;
  deleteSingleMedia: (
    media: Media,
    onSuccess?: (media: Media) => Promise<void>,
  ) => Promise<Awaited<ReturnType<typeof deleteMediaAction>>>;
  isLoading: boolean;
  isCompleted: boolean;
  completed: UploadMedia[];
  mediaPendingToUpdate: UploadMedia[];
  mediaPendingToCreate: UploadMedia[];
  isMediaCompleted: (m: UploadMedia) => boolean;
  generateUniqueMediaId: () => number;
};

// ============================================================================
// Context Setup
// ============================================================================

const MediaContext = createContext<MediaContextType | null>(null);

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const t = useTranslations();
  const [mediaUploads, setMediaUploads] = useState<UploadMedia[]>([]);
  const { refresh: refreshUserMetrics } = useUserMetrics();

  const nextUniqueId = useRef(Date.now());
  const generateUniqueMediaId = useCallback(() => {
    nextUniqueId.current += 1;
    return nextUniqueId.current;
  }, []);

  const inFlightUploads = useRef(new Set<number>());

  // ============================================================================
  // Helper Functions
  // ============================================================================
  const isMediaCompleted = (m: UploadMedia): boolean =>
    !m.pending && !!(m.data || m.error || m.deleted);

  const updateUploadByUniqueId = (
    uniqueId: number,
    updates: Partial<Pick<UploadMedia, "pending" | "data" | "error">>,
  ) => {
    setMediaUploads((prev) => {
      const target = prev.find((m) => m.unique_id === uniqueId);
      if (!target) return prev;
      return prev.map((upload) =>
        upload.unique_id === uniqueId ? { ...upload, ...updates } : upload,
      );
    });
  };

  /**
   * The upload status line renders `errors` only, so field-level rejections (oversize file,
   * bad mime, failed schema) have to be promoted into it. Without this they collapse into a
   * meaningless generic message while the real reason stays buried in `inputErrors`.
   */
  const extractReturnError = (
    result: ActionReturn<unknown>,
  ): ReturnError<Record<string, string>> => {
    const inputErrorMessages = Object.values(result.inputErrors ?? {}).filter(
      (message): message is string => typeof message === "string" && !!message,
    );

    return {
      errors: result.errors?.length
        ? result.errors
        : inputErrorMessages.length
          ? inputErrorMessages
          : [t("actions.genericError")],
      inputErrors: result.inputErrors,
    };
  };

  // ============================================================================
  // State Management Functions
  // ============================================================================

  const upsertMediaUpload = useCallback((mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      let idx = prev.findIndex((m) => m.unique_id === mediaUpload.unique_id);

      // Fallback: prevent duplicates when called before React re-renders
      if (idx === -1 && mediaUpload.id) {
        idx = prev.findIndex(
          (m) => m.id === mediaUpload.id || m.data?.id === mediaUpload.id,
        );
      }

      if (idx !== -1) {
        const existing = prev[idx];
        if (
          existing.previewUrl?.startsWith("blob:") &&
          existing.previewUrl !== mediaUpload.previewUrl
        ) {
          URL.revokeObjectURL(existing.previewUrl);
        }
        return prev.map((upload, i) =>
          i === idx ? { ...mediaUpload } : upload,
        );
      }

      return [...prev, { ...mediaUpload }];
    });
  }, []);

  const removeMediaUpload = useCallback((uniqueId: number) => {
    setMediaUploads((prev) => {
      const target = prev.find((m) => m.unique_id === uniqueId);
      if (!target) return prev;
      if (target.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((m) => m.unique_id !== uniqueId);
    });
  }, []);

  const addMediaUploads = useCallback(
    (mediaInput: (CreateMediaInputWithFile & { previewUrl?: string })[]) => {
      setMediaUploads((prev) => [
        ...prev,
        ...mediaInput.map(
          ({ previewUrl, ...input }): UploadMedia => ({
            input,
            previewUrl,
            action: "create",
            pending: false,
            unique_id: generateUniqueMediaId(),
          }),
        ),
      ]);
    },
    [generateUniqueMediaId],
  );

  const pushMediaUpload = useCallback((mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      const exists = prev.some((m) => m.unique_id === mediaUpload.unique_id);
      if (exists) return prev;
      return [...prev, mediaUpload];
    });
  }, []);

  const setMediaUploadsDirect = useCallback((mediaUploads: UploadMedia[]) => {
    setMediaUploads(mediaUploads);
  }, []);

  const handleRemoveCompleted = () => {
    setMediaUploads((prev) => {
      return prev.filter((upload) => {
        const toRemove =
          !upload.pending && (upload.data || upload.error || upload.deleted);
        if (toRemove && upload.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(upload.previewUrl);
        }
        return !toRemove;
      });
    });
  };

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const isLoading = useMemo(
    () => mediaUploads.some((m) => m.pending),
    [mediaUploads],
  );
  const completed: UploadMedia[] = useMemo(
    () => mediaUploads.filter((m) => isMediaCompleted(m)),
    [mediaUploads, isMediaCompleted],
  );
  const isCompleted = useMemo(
    () => !mediaUploads.some((m) => !isMediaCompleted(m)),
    [mediaUploads, isMediaCompleted],
  );
  const mediaPendingToUpdate = useMemo(
    () => mediaUploads.filter((m) => !!m.id && !isMediaCompleted(m)),
    [mediaUploads, isMediaCompleted],
  );
  const mediaPendingToCreate = useMemo(
    () => mediaUploads.filter((m) => !m.id && !isMediaCompleted(m)),
    [mediaUploads, isMediaCompleted],
  );

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const uploadSingleMedia = async (
    uniqueId: number,
    onSuccess?: (media: Media) => void,
  ) => {
    if (inFlightUploads.current.has(uniqueId)) return;

    const media = mediaUploads.find((m) => m.unique_id === uniqueId);
    if (!media) return;

    inFlightUploads.current.add(uniqueId);

    setMediaUploads((prev) => {
      const currentMedia = prev.find((m) => m.unique_id === uniqueId);
      if (
        !currentMedia ||
        currentMedia.pending ||
        currentMedia.error ||
        currentMedia.data
      ) {
        return prev;
      }
      return prev.map((upload) =>
        upload.unique_id === uniqueId
          ? { ...upload, pending: true, error: undefined }
          : upload,
      );
    });

    try {
      let result: ActionReturn<Media>;

      if (media.id) {
        const { file, ...updateInput } = media.input;
        result = await updateMediaApi(
          media.id,
          updateInput as UpdateMediaInput,
        );
      } else {
        result = await createMediaApi(media.input);

        for (
          let attempt = 1;
          attempt < MEDIA_UPLOAD_MAX_RETRIES &&
          !result.data &&
          isTransientMediaUploadError(result.errors ?? []);
          attempt += 1
        ) {
          await sleep(MEDIA_UPLOAD_RETRY_BASE_DELAY_MS * attempt);
          result = await createMediaApi(media.input);
        }
      }

      if (result.data) {
        if (media.onSuccess) {
          await media.onSuccess(result.data);
        }
        if (onSuccess) {
          onSuccess(result.data);
        }
        updateUploadByUniqueId(uniqueId, {
          pending: false,
          data: result.data,
          error: undefined,
        });

        if (media.generate_seo && result.data.id) {
          generateSeoSingleMedia(result.data);
        }
      } else {
        const returnError = extractReturnError(result);
        updateUploadByUniqueId(uniqueId, {
          pending: false,
          data: undefined,
          error: returnError,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      updateUploadByUniqueId(uniqueId, {
        pending: false,
        data: undefined,
        error: {
          errors: [errorMessage],
          inputErrors: undefined,
        },
      });
    } finally {
      inFlightUploads.current.delete(uniqueId);
    }
  };

  const generateSeoSingleMedia = async (
    media: Media,
    onSuccess?: (result: ActionReturn<Media>, media: Media) => Promise<void>,
  ) => {
    const currentMediaUpload = mediaUploads.find(
      (m) => m.id === media.id || m.data?.id === media.id,
    );

    const baseUpload: UploadMedia = currentMediaUpload
      ? {
          ...currentMediaUpload,
          unique_id: currentMediaUpload.unique_id ?? generateUniqueMediaId(),
        }
      : {
          input: {
            user_id: media.user_id,
            title: media.title ?? "",
            description: media.description ?? "",
            seo_title: media.seo_title ?? "",
            seo_description: media.seo_description ?? "",
            seo_alt: media.seo_alt ?? "",
          },
          action: "seo",
          previewUrl: media.thumbnail || undefined,
          id: media.id,
          pending: false,
          unique_id: generateUniqueMediaId(),
        };

    upsertMediaUpload({
      ...baseUpload,
      pending: true,
      error: undefined,
      data: undefined,
      previewUrl: media.thumbnail || undefined,
    });

    try {
      const result = await generateMediaMetadataApi({
        media_id: media.id,
        user_id: media.user_id,
      });

      if (!result.data) {
        const error = {
          errors:
            result.errors && result.errors.length > 0
              ? result.errors
              : ["Failed to generate SEO"],
          inputErrors: result.inputErrors,
        };

        upsertMediaUpload({
          ...baseUpload,
          pending: false,
          data: undefined,
          error,
          previewUrl: media.thumbnail || undefined,
        });

        return result;
      }

      const updatedUpload: UploadMedia = {
        ...baseUpload,
        pending: false,
        error: undefined,
        data: result.data,
        previewUrl: media.thumbnail || undefined,
        input: {
          ...baseUpload.input,
          ...result.data,
        },
      };

      upsertMediaUpload(updatedUpload);
      await refreshUserMetrics();

      if (onSuccess) {
        await onSuccess(result, media);
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      upsertMediaUpload({
        ...baseUpload,
        pending: false,
        data: undefined,
        error: {
          errors: [message],
          inputErrors: undefined,
        },
        previewUrl: media.thumbnail || undefined,
      });

      return {
        data: null,
        errors: [message],
        inputErrors: undefined,
      };
    }
  };

  const deleteSingleMedia = async (
    media: Media,
    onSuccess?: (media: Media) => Promise<void>,
  ) => {
    const currentMediaUpload = mediaUploads.find(
      (m) => m.id === media.id || m.data?.id === media.id,
    );

    const baseUpload: UploadMedia = currentMediaUpload
      ? {
          ...currentMediaUpload,
          unique_id: currentMediaUpload.unique_id ?? generateUniqueMediaId(),
        }
      : {
          input: {
            user_id: media.user_id,
            title: media.title ?? "",
            description: media.description ?? "",
            seo_title: media.seo_title ?? "",
            seo_description: media.seo_description ?? "",
            seo_alt: media.seo_alt ?? "",
          },
          action: "delete",
          previewUrl: media.thumbnail || undefined,
          id: media.id,
          pending: false,
          unique_id: generateUniqueMediaId(),
        };

    upsertMediaUpload({
      ...baseUpload,
      action: "delete",
      pending: true,
      error: undefined,
      data: undefined,
      deleted: undefined,
      previewUrl: media.thumbnail || undefined,
    });

    try {
      const result = await deleteMediaAction(media.id);

      if (!result.data) {
        const error = {
          errors:
            result.errors && result.errors.length > 0
              ? result.errors
              : ["Failed to delete media"],
          inputErrors: result.inputErrors,
        };

        upsertMediaUpload({
          ...baseUpload,
          action: "delete",
          pending: false,
          data: undefined,
          deleted: undefined,
          error,
          previewUrl: media.thumbnail || undefined,
        });

        return result;
      }

      upsertMediaUpload({
        ...baseUpload,
        action: "delete",
        pending: false,
        error: undefined,
        data: undefined,
        deleted: true,
        previewUrl: media.thumbnail || undefined,
      });

      if (onSuccess) {
        await onSuccess(media);
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      upsertMediaUpload({
        ...baseUpload,
        action: "delete",
        pending: false,
        data: undefined,
        deleted: undefined,
        error: {
          errors: [message],
          inputErrors: undefined,
        },
        previewUrl: media.thumbnail || undefined,
      });

      return {
        data: null,
        errors: [message],
        inputErrors: undefined,
      };
    }
  };

  // ============================================================================
  // Batch Operations
  // ============================================================================

  const handleUpload = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    await runWithConcurrency(mediaUploads, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      uploadSingleMedia(m.unique_id),
    );
  };

  const generateManySeoMedia = async (media: Media[]) => {
    // Pre-register every selected media as a queued "seo" upload so the modal
    // reflects the whole batch, not just the few requests currently in-flight
    // (limited by MEDIA_UPLOAD_CONCURRENCY). generateSeoSingleMedia matches
    // these by id and flips them to pending as workers pick them up.
    for (const m of media) {
      upsertMediaUpload({
        input: {
          user_id: m.user_id,
          title: m.title ?? "",
          description: m.description ?? "",
          seo_title: m.seo_title ?? "",
          seo_description: m.seo_description ?? "",
          seo_alt: m.seo_alt ?? "",
        },
        action: "seo",
        previewUrl: m.thumbnail || undefined,
        id: m.id,
        pending: false,
        data: undefined,
        error: undefined,
        deleted: undefined,
        unique_id: generateUniqueMediaId(),
      });
    }

    await runWithConcurrency(media, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      generateSeoSingleMedia(m),
    );
  };

  const handleUploadUpdates = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    const uploadsToUpdate = mediaUploads.filter(
      (m) => !!m.id && !m.pending && !m.data && !m.error,
    );

    await runWithConcurrency(uploadsToUpdate, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      uploadSingleMedia(m.unique_id),
    );
  };

  const handleUploadInserts = async (onSuccess?: (media: Media) => void) => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    const uploadsToInsert = mediaUploads.filter(
      (m) => !m.id && !m.pending && !m.data && !m.error,
    );

    await runWithConcurrency(uploadsToInsert, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      uploadSingleMedia(m.unique_id, onSuccess),
    );
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: MediaContextType = {
    mediaUploads,
    addMediaUploads,
    pushMediaUpload,
    setMediaUploads: setMediaUploadsDirect,
    handleRemoveCompleted,
    upsertMediaUpload,
    removeMediaUpload,
    uploadSingleMedia,
    generateSeoSingleMedia,
    generateManySeoMedia,
    deleteSingleMedia,
    isLoading,
    isCompleted,
    completed,
    mediaPendingToUpdate,
    mediaPendingToCreate,
    isMediaCompleted,
    handleUpload,
    handleUploadUpdates,
    handleUploadInserts,
    generateUniqueMediaId,
  };

  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};

export default MediaProvider;
