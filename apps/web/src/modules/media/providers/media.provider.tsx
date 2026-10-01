"use client";

import type { GenerateManyMediaMetadataResult } from "@repo/common-lib/types/ai";
import type { LocationInput } from "@repo/common-lib/types/location";
import type {
  CreateMediaInputWithFile,
  Media,
  UpdateMediaInput,
  UpdateMediaLocationsInput,
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setClientTranslator } from "@/lib/i18n/client-translator";
import { generateManyMediaMetadataAction } from "@/modules/ai/actions/generate-many-media-metadata.action";
import { generateMediaMetadataAction } from "@/modules/ai/actions/generate-media-metadata.action";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { useSubscribeToUserNotification } from "@/modules/user-notifications/hooks/useSubscribeToUserNotification";
import { createMediaApi, updateMediaApi } from "../api/media-api.client";
import { deleteManyMediaAction } from "../server-actions/delete-many-media.action";
import { deleteMediaAction } from "../server-actions/delete-media.action";
import { updateMediaLocationsAction } from "../server-actions/update-media-locations.action";
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
  /**
   * Handed to a batch handler but still waiting for a concurrency slot.
   *
   * Distinct from `pending`, which only covers uploads with a slot: `MEDIA_UPLOAD_CONCURRENCY`
   * is 3, so selecting ten files leaves seven that are committed to upload yet otherwise
   * indistinguishable from files still staged in the dialog.
   */
  enqueued?: boolean;
  data?: Media;
  deleted?: boolean;
  unique_id: number;
  error?: ReturnError<Record<string, string>>;
  /**
   * 0-100 while a create's bytes are being PUT directly to S3. Unset before the transfer starts
   * and cleared the moment `id` is assigned — from then on the server owns the rest of the work,
   * so there is nothing left for a byte-transfer percentage to describe.
   */
  progress?: number;
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
  updateManyMediaLocation: (input: {
    location: LocationInput;
    media: Media[];
  }) => Promise<void>;
  deleteSingleMedia: (
    media: Media,
  ) => Promise<Awaited<ReturnType<typeof deleteMediaAction>>>;
  deleteManyMedia: (
    media: Media[],
  ) => Promise<Awaited<ReturnType<typeof deleteManyMediaAction>>>;
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
  mediaInProgress: UploadMedia[];
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

  // `media-api.client.ts` validates uploads before sending them, but its signatures are fixed
  // by this provider and it cannot call a hook — so it reads the translator from here.
  useEffect(() => {
    setClientTranslator(t);
  }, [t]);

  // Native "leave site?" confirmation while a create's bytes are still going out over this
  // tab's own connection (no `id` yet). Once `id` lands, `createAsync` already returned and
  // `writeOriginalAndEnqueue` is running server-side — closing the tab from that point on loses
  // nothing, so the guard has to come off, not just show a text warning that is easy to ignore.
  useEffect(() => {
    const isTransferring = mediaUploads.some(
      (m) => m.action === "create" && m.pending && !m.id,
    );
    if (!isTransferring) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [mediaUploads]);

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
    updates: Partial<
      Pick<UploadMedia, "pending" | "data" | "error" | "id" | "progress">
    >,
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
   * location, the AI toggle) need. `index` is the position among staged items, for per-item budgeting like
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

  /**
   * Everything the user has committed to and is still waiting on — in flight or queued behind
   * the concurrency limit.
   *
   * Exists because the create dialog closes the moment it hands off (`setOpen(false)` then
   * `handleUploadInserts()`), and nothing else renders until the media's websocket notification
   * arrives. That left a window with no sign an upload was happening at all.
   */
  const mediaInProgress = useMemo(
    () =>
      mediaUploads.filter(
        (m) => !isMediaProcessed(m) && (m.pending || m.enqueued),
      ),
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
        result = await createMediaApi(media.input, (percent) => {
          updateUploadByUniqueId(uniqueId, { progress: percent });
        });
        if (result.data) {
          // `id` is the handoff signal `statusKey` and `mediaInProgress` key off: once it is
          // set, the bytes are already in S3 and `createAsync` already returned, so nothing
          // further depends on this tab. Clearing `progress` here (rather than leaving the
          // last percent behind) is what flips the row from the transfer bar to the
          // "we'll notify you" message.
          updateUploadByUniqueId(uniqueId, {
            id: result.data.id,
            progress: undefined,
          });
        }
      }
      if (!result.data) {
        //request failed, maybe validation...
        updateUploadByUniqueId(uniqueId, {
          pending: false,
          data: undefined,
          error: extractReturnError(result),
          progress: undefined,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      updateUploadByUniqueId(uniqueId, {
        pending: false,
        data: undefined,
        progress: undefined,
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
      const result = await generateMediaMetadataAction(media.id);
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

  const deleteManyMedia = async (media: Media[]) => {
    const items = [...new Map(media.map((item) => [item.id, item])).values()];
    const ids = new Set(items.map((item) => item.id));
    const current = mediaUploadsRef.current;
    const created = new Map(
      items
        .filter(
          (item) =>
            !current.some(
              (upload) => upload.id === item.id || upload.data?.id === item.id,
            ),
        )
        .map((item) => [item.id, generateUniqueMediaId()]),
    );

    // Pending before the request leaves, so the cards are locked (`isMediaLoading`) for the
    // whole delete and nothing can edit, regenerate or relocate them in the meantime.
    setMediaUploads((prev) => {
      const next = prev.map((upload) =>
        upload.id && ids.has(upload.id)
          ? {
              ...upload,
              action: "delete" as const,
              pending: true,
              error: undefined,
            }
          : upload,
      );
      for (const item of items) {
        const uniqueId = created.get(item.id);
        if (uniqueId === undefined) continue;
        next.push({
          input: { user_id: item.user_id },
          action: "delete",
          previewUrl: item.thumbnail || undefined,
          id: item.id,
          pending: true,
          error: undefined,
          unique_id: uniqueId,
        });
      }
      return next;
    });

    const release = (failed: Map<number, string>) =>
      setMediaUploads((prev) =>
        prev.map((upload) => {
          if (!upload.id || !ids.has(upload.id)) return upload;
          const message = failed.get(upload.id);
          // Deleted rows are finished by the DELETE_MEDIA notification; only the ones that
          // stayed behind are unlocked.
          if (message === undefined) {
            return {
              ...upload,
              pending: false,
              deleted: true,
              data: undefined,
            };
          }
          return {
            ...upload,
            action: "edit" as const,
            pending: false,
            error: { errors: [message], inputErrors: undefined },
          };
        }),
      );

    try {
      const result = await deleteManyMediaAction(items.map((item) => item.id));
      if (!result.data) {
        const message = extractReturnError(result).errors[0] ?? "";
        release(new Map([...ids].map((id) => [id, message])));
        return result;
      }
      release(new Map(result.data.errors.map((e) => [e.media_id, e.message])));
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      release(new Map([...ids].map((id) => [id, message])));
      return {
        data: null,
        errors: [message],
        inputErrors: undefined,
      };
    }
  };

  const updateMediaLocationsRef = useRef<UpdateMediaLocationsInput | null>(
    null,
  );
  // Rows that held an unsaved edit when the batch started. The card treats `data` as "saved,
  // no draft", so writing the batch result there would silently throw the artist's edits away.
  const updateMediaLocationsDraftIdsRef = useRef<Set<number>>(new Set());
  const { handleAction: updateMediaLocations } = useHandleAction<
    UpdateMediaLocationsInput,
    Media[]
  >({
    action: async () => {
      const input = updateMediaLocationsRef.current;
      if (!input) {
        return { data: null, errors: [t("actions.genericError")] };
      }
      try {
        return await updateMediaLocationsAction(input);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("actions.genericError");
        return { data: null, errors: [message] };
      }
    },
    afterAction: async (result) => {
      const requestedIds = new Set(
        updateMediaLocationsRef.current?.media ?? [],
      );
      const draftIds = updateMediaLocationsDraftIdsRef.current;
      updateMediaLocationsRef.current = null;
      updateMediaLocationsDraftIdsRef.current = new Set();
      if (requestedIds.size === 0) return;

      if (result.data) {
        const byId = new Map(result.data.map((media) => [media.id, media]));
        setMediaUploads((prev) =>
          prev.map((upload) => {
            if (!upload.id || !requestedIds.has(upload.id)) return upload;
            // The saved place reaches the card through the revalidated page instead.
            if (draftIds.has(upload.id)) {
              return { ...upload, pending: false, error: undefined };
            }
            const media = byId.get(upload.id);
            if (!media) {
              return {
                ...upload,
                pending: false,
                data: undefined,
                error: {
                  errors: [t("actions.genericError")],
                  inputErrors: undefined,
                },
              };
            }
            return {
              ...upload,
              data: media,
              pending: false,
              error: undefined,
            };
          }),
        );
        return;
      }

      const error = extractReturnError(result);
      setMediaUploads((prev) =>
        prev.map((upload) =>
          upload.id && requestedIds.has(upload.id)
            ? draftIds.has(upload.id)
              ? { ...upload, pending: false }
              : { ...upload, pending: false, data: undefined, error }
            : upload,
        ),
      );
    },
  });

  // ============================================================================
  // Batch Operations
  // ============================================================================

  const updateManyMediaLocation = async (input: {
    location: LocationInput;
    media: Media[];
  }) => {
    if (!input.media.length || updateMediaLocationsRef.current) return;

    const mediaById = new Map(input.media.map((item) => [item.id, item]));
    const media = [...mediaById.values()];
    const current = mediaUploadsRef.current;
    const created = media
      .filter(
        (item) =>
          !current.some(
            (upload) => upload.id === item.id || upload.data?.id === item.id,
          ),
      )
      .map((item) => ({
        item,
        unique_id: generateUniqueMediaId(),
      }));

    updateMediaLocationsRef.current = {
      location: input.location,
      media: media.map((item) => item.id),
    };
    updateMediaLocationsDraftIdsRef.current = new Set(
      current
        .filter(
          (upload) =>
            upload.id &&
            upload.action === "edit" &&
            !upload.data &&
            !upload.deleted &&
            !upload.pending &&
            mediaById.has(upload.id),
        )
        .map((upload) => upload.id as number),
    );
    setMediaUploads((prev) => {
      const next = [...prev];
      for (const item of media) {
        const index = next.findIndex(
          (upload) => upload.id === item.id || upload.data?.id === item.id,
        );
        if (index === -1) {
          const row = created.find((entry) => entry.item.id === item.id);
          if (!row) continue;
          next.push({
            input: {
              user_id: item.user_id,
              location: input.location,
            },
            action: "edit",
            previewUrl: item.thumbnail || undefined,
            id: item.id,
            pending: true,
            error: undefined,
            unique_id: row.unique_id,
          });
          continue;
        }
        const upload = next[index];
        // A draft keeps its own input: the batch place is saved, not staged into the edit.
        if (
          upload.id &&
          updateMediaLocationsDraftIdsRef.current.has(upload.id)
        ) {
          next[index] = { ...upload, pending: true, error: undefined };
          continue;
        }
        next[index] = {
          ...upload,
          action: "edit",
          pending: true,
          error: undefined,
          input: { ...upload.input, location: input.location },
        };
      }
      return next;
    });

    await updateMediaLocations();
  };

  const generateManySeoRef = useRef<number[] | null>(null);
  const { handleAction: generateManySeo } = useHandleAction<
    { media: number[] },
    GenerateManyMediaMetadataResult
  >({
    action: async () => {
      const mediaIds = generateManySeoRef.current;
      if (!mediaIds) {
        return { data: null, errors: [t("actions.genericError")] };
      }
      try {
        return await generateManyMediaMetadataAction(mediaIds);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("actions.genericError");
        return { data: null, errors: [message] };
      }
    },
    afterAction: async (result) => {
      const requestedIds = new Set(generateManySeoRef.current ?? []);
      generateManySeoRef.current = null;
      if (requestedIds.size === 0) return;

      if (!result.data) {
        const error = extractReturnError(result);
        setMediaUploads((prev) =>
          prev.map((upload) =>
            upload.id && requestedIds.has(upload.id)
              ? { ...upload, pending: false, data: undefined, error }
              : upload,
          ),
        );
        return;
      }

      const failed = new Map(
        result.data.errors.map((item) => [item.media_id, item.message]),
      );
      const queued = new Set(result.data.media.map((item) => item.id));
      setMediaUploads((prev) =>
        prev.map((upload) => {
          if (!upload.id || !requestedIds.has(upload.id)) return upload;
          const message = failed.get(upload.id);
          if (message) {
            return {
              ...upload,
              pending: false,
              data: undefined,
              error: { errors: [message], inputErrors: undefined },
            };
          }
          if (queued.has(upload.id)) {
            // Stay pending until the metadata notification lands. The row returned here
            // is still COMPLETED — the worker has not started.
            return { ...upload, pending: true, error: undefined };
          }
          return {
            ...upload,
            pending: false,
            data: undefined,
            error: {
              errors: [t("actions.genericError")],
              inputErrors: undefined,
            },
          };
        }),
      );
    },
  });

  const generateManySeoMedia = async (media: Media[]) => {
    if (!media.length || generateManySeoRef.current) return;

    const mediaById = new Map(media.map((item) => [item.id, item]));
    const items = [...mediaById.values()];
    const current = mediaUploadsRef.current;
    const created = items
      .filter(
        (item) =>
          !current.some(
            (upload) => upload.id === item.id || upload.data?.id === item.id,
          ),
      )
      .map((item) => ({
        item,
        unique_id: generateUniqueMediaId(),
      }));

    generateManySeoRef.current = items.map((item) => item.id);
    setMediaUploads((prev) => {
      const next = [...prev];
      for (const item of items) {
        const index = next.findIndex(
          (upload) => upload.id === item.id || upload.data?.id === item.id,
        );
        if (index === -1) {
          const row = created.find((entry) => entry.item.id === item.id);
          if (!row) continue;
          next.push({
            input: { user_id: item.user_id },
            action: "seo",
            previewUrl: item.thumbnail || undefined,
            id: item.id,
            pending: true,
            error: undefined,
            unique_id: row.unique_id,
          });
          continue;
        }
        next[index] = {
          ...next[index],
          action: "seo",
          pending: true,
          error: undefined,
          data: undefined,
        };
      }
      return next;
    });

    await generateManySeo();
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
  /**
   * Marks a whole batch as committed before the first request leaves, so the status panel can
   * show every file straight away instead of revealing them three at a time as slots free up.
   */
  const markEnqueued = (uploads: UploadMedia[]) => {
    const queued = new Set(uploads.map((m) => m.unique_id));
    setMediaUploads((prev) =>
      prev.map((upload) =>
        queued.has(upload.unique_id) ? { ...upload, enqueued: true } : upload,
      ),
    );
  };

  const handleUploadUpdates = async () => {
    const uploadsToUpdate = mediaUploadsRef.current.filter(
      (m) => !!m.id && !m.pending && !m.data && !m.error,
    );
    if (!uploadsToUpdate.length) return;

    markEnqueued(uploadsToUpdate);

    await runWithConcurrency(uploadsToUpdate, MEDIA_UPLOAD_CONCURRENCY, (m) =>
      uploadSingleMedia(m.unique_id),
    );
  };

  const handleUploadInserts = async () => {
    const uploadsToInsert = mediaUploadsRef.current.filter(
      (m) => !m.id && !m.pending && !m.data && !m.error,
    );
    if (!uploadsToInsert.length) return;

    markEnqueued(uploadsToInsert);

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
    updateManyMediaLocation,
    deleteSingleMedia,
    deleteManyMedia,
    isLoading,
    isMediaLoading,
    mediaPendingToUpdate,
    mediaPendingToCreate,
    mediaStagedToCreate,
    updateStagedCreateInputs,
    mediaRequestFailed,
    mediaInProgress,
    handleUploadUpdates,
    handleUploadInserts,
    generateUniqueMediaId,
  };

  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};

export default MediaProvider;
