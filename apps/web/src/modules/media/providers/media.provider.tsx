"use client";

import { CreateMediaInputWithFile, Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useRef } from "react";
import { createMediaAction } from "../server-actions/create-media.action";
import { updateMediaAction } from "../server-actions/update-media.action";
import { ReturnError } from "@repo/common-lib/types/response";
import { getMediaSeoAction } from "@/modules/ai/actions/get-media-seo.action";
import { deleteMediaAction } from "../server-actions/delete-media.action";


// ============================================================================
// Types
// ============================================================================

type UploadMediaAction = 'create' | 'edit' | 'seo' | 'delete'
export type UploadMedia = {
  input: CreateMediaInputWithFile,
  action: UploadMediaAction,
  //If has id is an update
  id?: number,
  previewUrl?: string,
  pending: boolean,
  data?: Media,
  deleted?: boolean,
  unique_id: number,
  onSuccess?: (media: Media) => Promise<void>,
  error?: ReturnError<Record<string, string>>
}

type MediaContextType = {
  mediaUploads: UploadMedia[];
  addMediaUploads: (mediaInput: (CreateMediaInputWithFile & { previewUrl?: string })[]) => void;
  pushMediaUpload: (mediaUpload: UploadMedia) => void;
  setMediaUploads: (mediaUploads: UploadMedia[]) => void;
  handleRemoveCompleted: () => void;
  handleUpload: () => Promise<void>;
  handleUploadUpdates: () => Promise<void>;
  handleUploadInserts: (onSuccess?: (media: Media) => void) => Promise<void>;
  upsertMediaUpload: (mediaUpload: UploadMedia) => void;
  removeMediaUpload: (uniqueId: number) => void;
  uploadSingleMedia: (uniqueId: number, onSuccess?: (media: Media) => void) => Promise<void>;
  generateSeoSingleMedia: (media: Media) => ReturnType<typeof getMediaSeoAction>;
  generateManySeoMedia: (media: Media[]) => Promise<void>;
  deleteSingleMedia: (media: Media, onSuccess?: (media: Media) => Promise<void>) => Promise<Awaited<ReturnType<typeof deleteMediaAction>>>;
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

export const MediaProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [mediaUploads, setMediaUploads] = useState<UploadMedia[]>([]);

  const nextUniqueId = useRef(Date.now());
  const generateUniqueMediaId = useCallback(() => {
    nextUniqueId.current += 1;
    return nextUniqueId.current;
  }, []);

  // ============================================================================
  // Helper Functions
  // ============================================================================
  const isMediaCompleted = (m: UploadMedia): boolean => !m.pending && !!(m.data || m.error || m.deleted);

  const updateUploadByUniqueId = (
    uniqueId: number,
    updates: Partial<Pick<UploadMedia, 'pending' | 'data' | 'error'>>
  ) => {
    setMediaUploads((prev) => {
      const target = prev.find(m => m.unique_id === uniqueId);
      if (!target) return prev;
      return prev.map((upload) =>
        upload.unique_id === uniqueId ? { ...upload, ...updates } : upload
      );
    });
  };

  const extractReturnError = (
    result:
      | Awaited<ReturnType<typeof createMediaAction>>
      | Awaited<ReturnType<typeof updateMediaAction>>
      | Awaited<ReturnType<typeof getMediaSeoAction>>
  ): ReturnError<Record<string, string>> => {
    return {
      errors: result.errors && result.errors.length > 0 ? result.errors : ['Request failed'],
      inputErrors: result.inputErrors
    };
  };

  // ============================================================================
  // State Management Functions
  // ============================================================================

  const upsertMediaUpload = useCallback((mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      let idx = prev.findIndex(m => m.unique_id === mediaUpload.unique_id);

      // Fallback: prevent duplicates when called before React re-renders
      if (idx === -1 && mediaUpload.id) {
        idx = prev.findIndex(m => m.id === mediaUpload.id || m.data?.id === mediaUpload.id);
      }

      if (idx !== -1) {
        const existing = prev[idx];
        if (existing.previewUrl &&
          existing.previewUrl.startsWith('blob:') &&
          existing.previewUrl !== mediaUpload.previewUrl) {
          URL.revokeObjectURL(existing.previewUrl);
        }
        return prev.map((upload, i) =>
          i === idx ? { ...mediaUpload } : upload
        );
      }

      return [...prev, { ...mediaUpload }];
    });
  }, []);

  const removeMediaUpload = useCallback((uniqueId: number) => {
    setMediaUploads((prev) => {
      const target = prev.find(m => m.unique_id === uniqueId);
      if (!target) return prev;
      if (target.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(m => m.unique_id !== uniqueId);
    });
  }, []);

  const addMediaUploads = useCallback(
    (mediaInput: (CreateMediaInputWithFile & { previewUrl?: string })[]) => {
      setMediaUploads((prev) => [
        ...prev,
        ...mediaInput.map(({ previewUrl, ...input }): UploadMedia => ({
          input,
          previewUrl,
          action: 'create',
          pending: false,
          unique_id: generateUniqueMediaId(),
        })),
      ]);
    },
    [generateUniqueMediaId]
  );

  const pushMediaUpload = useCallback((mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      const exists = prev.some(m => m.unique_id === mediaUpload.unique_id);
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
        const toRemove = !upload.pending && (upload.data || upload.error || upload.deleted)
        if (toRemove && upload.previewUrl && upload.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(upload.previewUrl);
        }
        return !toRemove;
      });
    });
  };

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const isLoading = useMemo(() => mediaUploads.some(m => m.pending), [mediaUploads]);
  const completed: UploadMedia[] = useMemo(() => mediaUploads.filter(m => isMediaCompleted(m)), [mediaUploads]);
  const isCompleted = useMemo(() => !mediaUploads.some(m => !isMediaCompleted(m)), [mediaUploads]);
  const mediaPendingToUpdate = useMemo(() => mediaUploads.filter(m => !!m.id && !isMediaCompleted(m)), [mediaUploads]);
  const mediaPendingToCreate = useMemo(() => mediaUploads.filter(m => !m.id && !isMediaCompleted(m)), [mediaUploads]);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const uploadSingleMedia = async (uniqueId: number, onSuccess?: (media: Media) => void) => {
    const media = mediaUploads.find(m => m.unique_id === uniqueId);
    if (!media) return;

    setMediaUploads((prev) => {
      const currentMedia = prev.find(m => m.unique_id === uniqueId);
      if (!currentMedia || currentMedia.pending || currentMedia.error || currentMedia.data) {
        return prev;
      }
      return prev.map((upload) =>
        upload.unique_id === uniqueId
          ? { ...upload, pending: true, error: undefined }
          : upload
      );
    });

    try {
      let result: Awaited<ReturnType<typeof createMediaAction>> | Awaited<ReturnType<typeof updateMediaAction>>;

      if (media.id) {
        const { file, ...updateInput } = media.input;
        result = await updateMediaAction(media.id, updateInput as UpdateMediaInput);
      } else {
        result = await createMediaAction(media.input);
      }

      if (result.data) {
        if (media.onSuccess) {
          await media.onSuccess(result.data)
        }
        if (onSuccess) {
          onSuccess(result.data);
        }
        updateUploadByUniqueId(uniqueId, {
          pending: false,
          data: result.data,
          error: undefined
        });
      } else {
        const returnError = extractReturnError(result);
        updateUploadByUniqueId(uniqueId, {
          pending: false,
          data: undefined,
          error: returnError
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      updateUploadByUniqueId(uniqueId, {
        pending: false,
        data: undefined,
        error: {
          errors: [errorMessage],
          inputErrors: undefined
        }
      });
    }
  }

  const generateSeoSingleMedia = async (media: Media, onSuccess?: (result: Awaited<ReturnType<typeof getMediaSeoAction>>, media: Media) => Promise<void>) => {
    const currentMediaUpload = mediaUploads.find(m => m.id === media.id || m.data?.id === media.id);

    const baseUpload: UploadMedia = currentMediaUpload
      ? { ...currentMediaUpload, unique_id: currentMediaUpload.unique_id ?? generateUniqueMediaId() }
      : {
        input: {
          user_id: media.user_id,
          title: media.title || undefined,
          description: media.description || undefined,
          seo_title: media.seo_title || undefined,
          seo_description: media.seo_description || undefined,
          seo_alt: media.seo_alt || undefined,
          seo_filename: media.seo_filename || '',
        },
        action: 'seo',
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
      const result = await getMediaSeoAction({
        media_id: media.id,
        user_id: media.user_id
      });

      if (!result.data) {
        const error = {
          errors: result.errors && result.errors.length > 0 ? result.errors : ['Failed to generate SEO'],
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
          ...result.data
        },
      };

      upsertMediaUpload(updatedUpload);

      if (onSuccess) {
        await onSuccess(result, media);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';

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
  }


  const deleteSingleMedia = async (media: Media, onSuccess?: (media: Media) => Promise<void>) => {
    const currentMediaUpload = mediaUploads.find(m => m.id === media.id || m.data?.id === media.id);

    const baseUpload: UploadMedia = currentMediaUpload
      ? { ...currentMediaUpload, unique_id: currentMediaUpload.unique_id ?? generateUniqueMediaId() }
      : {
        input: {
          user_id: media.user_id,
          title: media.title || undefined,
          description: media.description || undefined,
          seo_title: media.seo_title || undefined,
          seo_description: media.seo_description || undefined,
          seo_alt: media.seo_alt || undefined,
          seo_filename: media.seo_filename || '',
        },
        action: 'delete',
        previewUrl: media.thumbnail || undefined,
        id: media.id,
        pending: false,
        unique_id: generateUniqueMediaId(),
      };

    upsertMediaUpload({
      ...baseUpload,
      action: 'delete',
      pending: true,
      error: undefined,
      data: undefined,
      deleted: undefined,
      previewUrl: media.thumbnail || undefined,
    });

    try {
      const result = await deleteMediaAction(media.id, media.user_id);

      if (!result.data) {
        const error = {
          errors: result.errors && result.errors.length > 0 ? result.errors : ['Failed to delete media'],
          inputErrors: result.inputErrors,
        };

        upsertMediaUpload({
          ...baseUpload,
          action: 'delete',
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
        action: 'delete',
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
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';

      upsertMediaUpload({
        ...baseUpload,
        action: 'delete',
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
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  const handleUpload = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    await Promise.all(
      mediaUploads.map((m) => uploadSingleMedia(m.unique_id))
    );
  }

  const generateManySeoMedia = async (media: Media[]) => {
    await Promise.all(
      media.map(m => generateSeoSingleMedia(m))
    );
  }

  const handleUploadUpdates = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    const uploadsToUpdate = mediaUploads
      .filter(m => !!m.id && !m.pending && !m.data && !m.error);

    await Promise.all(
      uploadsToUpdate.map(m => uploadSingleMedia(m.unique_id))
    );
  }

  const handleUploadInserts = async (onSuccess?: (media: Media) => void) => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    const uploadsToInsert = mediaUploads
      .filter(m => !m.id && !m.pending && !m.data && !m.error);

    await Promise.all(
      uploadsToInsert.map(m => uploadSingleMedia(m.unique_id, onSuccess))
    );
  }

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
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};

export default MediaProvider;
