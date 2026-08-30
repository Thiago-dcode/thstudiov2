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
import { MediaHelper } from "@repo/common-lib/utils/media";
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
import { useSubscribeToUserNotification } from "@/modules/user-notifications/hooks/useSubscribeToUserNotification";
import {
  createMediaApi,
  generateMediaMetadataApi,
  updateMediaApi,
} from "../api/media-api.client";
import { deleteMediaAction } from "../server-actions/delete-media.action";
import {
  MEDIA_UPLOAD_CONCURRENCY,
  runWithConcurrency,
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
  error?: ReturnError<Record<string, string>>;
};

type MediaContextType = {
  mediaUploads: UploadMedia[];
  addMediaUploads: (
    mediaInput: (CreateMediaInputWithFile & { previewUrl?: string })[],
  ) => void;
  handleRemoveCompleted: () => void;
  handleUploadUpdates: () => Promise<void>;
  handleUploadInserts: () => Promise<void>;
  upsertMediaUpload: (mediaUpload: UploadMedia) => void;
  removeMediaUpload: (uniqueId: number) => void;
  uploadSingleMedia: (uniqueId: number) => Promise<void>;
  generateSeoSingleMedia: (media: Media) => Promise<ActionReturn<Media>>;
  generateManySeoMedia: (media: Media[]) => Promise<void>;
  deleteSingleMedia: (
    media: Media,
  ) => Promise<Awaited<ReturnType<typeof deleteMediaAction>>>;
  isLoading: boolean;
  isMediaLoading: (media: Media) => boolean;
  mediaPendingToUpdate: UploadMedia[];
  mediaPendingToCreate: UploadMedia[];
  mediaStagedToCreate: UploadMedia[];
  updateStagedCreateInputs: (
    patch: (
      upload: UploadMedia,
      index: number,
    ) => Partial<CreateMediaInputWithFile>,
  ) => void;
  mediaRequestFailed: UploadMedia[];
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
  // Mirrors the latest list so async work reads current state instead of the snapshot its closure
  // captured. Batches are allowed to overlap, so by the time a queued upload actually runs its
  // render-time copy can be several updates old.
  const mediaUploadsRef = useRef(mediaUploads);
  mediaUploadsRef.current = mediaUploads;
  const nextUniqueId = useRef(Date.now());
  const generateUniqueMediaId = useCallback(() => {
    nextUniqueId.current += 1;
    return nextUniqueId.current;
  }, []);
  const inFlightUploads = useRef(new Set<number>());

  // ============================================================================
  // Helper Functions
  // ============================================================================
  const isMediaProcessed = (m: UploadMedia): boolean =>
    !m.pending && !!(m.data || m.error || m.deleted);

  const isMediaLoading = useCallback(
    (media: Media) => {
      const exists = mediaUploads.find(
        (m) => m.id === media.id || m.data?.id === media.id,
      );
      return exists?.pending || MediaHelper.isLoading(media);
    },
    [mediaUploads],
  );

  const updateUploadById = (
    id: number,
    updates: Partial<Pick<UploadMedia, "pending" | "data" | "error">>,
  ) => {
    setMediaUploads((prev) => {
      const target = prev.find((m) => m.id === id);
      if (!target) return prev;
      return prev.map((upload) =>
        upload.id === id ? { ...upload, ...updates } : upload,
      );
    });
  };
  const updateUploadByUniqueId = (
    uniqueId: number,
    updates: Partial<Pick<UploadMedia, "pending" | "data" | "error" | "id">>,
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
  const mediaPendingToUpdate = useMemo(
    () => mediaUploads.filter((m) => !!m.id && !isMediaProcessed(m)),
    [mediaUploads, isMediaProcessed],
  );
  const mediaPendingToCreate = useMemo(
    () => mediaUploads.filter((m) => !m.id && !isMediaProcessed(m)),
    [mediaUploads, isMediaProcessed],
  );

  /**
   * Selected but not yet sent — the subset the create dialog still lets you configure.
   * `mediaPendingToCreate` also contains creates that are already in flight, which is why the two
   * are not interchangeable: a dialog rendering the latter shows cards for files it can no longer
   * change, and counts them against the per-selection limit.
   */
  const mediaStagedToCreate = useMemo(
    () =>
      mediaUploads.filter((m) => !m.id && !m.pending && !m.data && !m.error),
    [mediaUploads],
  );

  /**
   * Applies a patch to every staged create — what the dialog's bulk controls (global compression,
   * the AI toggle) need. `index` is the position among staged items, for per-item budgeting like
   * AI credits.
   *
   * Maps over the whole list rather than replacing it with the staged subset: the callers used to
   * do `setMediaUploads(mediaPendingToCreate.map(...))`, which dropped every other entry — media
   * edits in flight, and the failed uploads the error modal renders.
   */
  const updateStagedCreateInputs = useCallback(
    (
      patch: (
        upload: UploadMedia,
        index: number,
      ) => Partial<CreateMediaInputWithFile>,
    ) => {
      setMediaUploads((prev) => {
        let stagedIndex = 0;
        return prev.map((upload) => {
          if (upload.id || upload.pending || upload.data || upload.error) {
            return upload;
          }
          const next = {
            ...upload,
            input: { ...upload.input, ...patch(upload, stagedIndex) },
          };
          stagedIndex += 1;
          return next;
        });
      });
    },
    [],
  );

  const mediaRequestFailed = useMemo(
    () => mediaUploads.filter((m) => !m.data && !m.pending && !!m.error),
    [mediaUploads],
  );

  const uploadSingleMedia = async (uniqueId: number) => {
    if (inFlightUploads.current.has(uniqueId)) return;

    // Decided against current state, and *before* the request: the eligibility check used to live
    // inside the `setMediaUploads` updater, which could only skip the state write — the call went
    // out regardless, so an entry that had already succeeded could be uploaded twice.
    const media = mediaUploadsRef.current.find((m) => m.unique_id === uniqueId);
    if (!media || media.pending || media.data || media.error) return;

    inFlightUploads.current.add(uniqueId);
    updateUploadByUniqueId(uniqueId, { pending: true, error: undefined });

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
        if (result.data) {
          updateUploadByUniqueId(uniqueId, {
            id: result.data.id,
          });
        }
      }
      if (!result.data) {
        //request failed, maybe validation...
        updateUploadByUniqueId(uniqueId, {
          pending: false,
          data: undefined,
          error: extractReturnError(result),
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

  const generateSeoSingleMedia = async (media: Media) => {
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
      //request failed, maybe validation...
      if (!result.data) {
        updateUploadByUniqueId(baseUpload.unique_id, {
          pending: false,
          data: undefined,
          error: extractReturnError(result),
        });
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

  const deleteSingleMedia = async (media: Media) => {
    try {
      const result = await deleteMediaAction(media.id);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
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

  const generateManySeoMedia = async (media: Media[]) => {
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

  /**
   * Both batch handlers deliberately have no "is anything else in flight?" guard.
   *
   * They used to bail on `isLoading`, which is true while *any* upload is pending — and a create
   * stays pending from the moment it is sent until its websocket notification lands, i.e. for the
   * whole of moderation and compression. So queueing a second batch while the first was still
   * processing silently did nothing at all. Per-item filtering below plus the `inFlightUploads`
   * guard in `uploadSingleMedia` already make overlapping batches safe.
   */
  const handleUploadUpdates = async () => {
    const uploadsToUpdate = mediaUploadsRef.current.filter(
      (m) => !!m.id && !m.pending && !m.data && !m.error,
    );
    if (!uploadsToUpdate.length) return;

    await runWithConcurrency(uploadsToUpdate, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      uploadSingleMedia(m.unique_id),
    );
  };

  const handleUploadInserts = async () => {
    const uploadsToInsert = mediaUploadsRef.current.filter(
      (m) => !m.id && !m.pending && !m.data && !m.error,
    );
    if (!uploadsToInsert.length) return;

    await runWithConcurrency(uploadsToInsert, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      uploadSingleMedia(m.unique_id),
    );
  };

  const syncUploadFromMedia = (payload: Media) => {
    updateUploadById(payload.id, {
      pending: MediaHelper.isLoading(payload),
      data: payload,
    });
  };

  useSubscribeToUserNotification({
    callbackId: "media-provider",
    createUpdateMediaCallback: syncUploadFromMedia,
    generateMetadataMediaCallback: syncUploadFromMedia,
    failedGenerateMediaMetadataCallback: (payload) => {
      updateUploadById(payload.id, {
        pending: false,
        data: undefined,
        error: {
          errors: [payload.failed_reason || t("actions.genericError")],
          inputErrors: undefined,
        },
      });
    },
    onDeleteMediaCallback: ({ id }) => {
      setMediaUploads((prev) => {
        if (!prev.some((m) => m.id === id)) return prev;
        return prev.map((upload) =>
          upload.id === id
            ? { ...upload, pending: false, deleted: true, data: undefined }
            : upload,
        );
      });
    },
  });

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: MediaContextType = {
    mediaUploads,
    addMediaUploads,
    handleRemoveCompleted,
    upsertMediaUpload,
    removeMediaUpload,
    uploadSingleMedia,
    generateSeoSingleMedia,
    generateManySeoMedia,
    deleteSingleMedia,
    isLoading,
    isMediaLoading,
    mediaPendingToUpdate,
    mediaPendingToCreate,
    mediaStagedToCreate,
    updateStagedCreateInputs,
    mediaRequestFailed,
    handleUploadUpdates,
    handleUploadInserts,
    generateUniqueMediaId,
  };

  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};

export default MediaProvider;
