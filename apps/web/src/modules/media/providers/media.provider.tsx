"use client";

import { CreateMediaInputWithFile, Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { createContext, useContext, ReactNode, useState, useMemo, useCallback } from "react";
import { createMediaAction } from "../server-actions/create-media.action";
import { updateMediaAction } from "../server-actions/update-media.action";
import { ReturnError } from "@repo/common-lib/types/response";
import { getMediaSeoAction } from "@/modules/ai/actions/get-media-seo.action";
import { GetMediaSeoResponse } from "@repo/common-lib/types/ai";


// ============================================================================
// Types
// ============================================================================

export type UploadMedia = {
  input: CreateMediaInputWithFile,
  //If has id is an update
  id?: number,
  previewUrl?: string,
  pending: boolean,
  data?: Media,
  seoData?: GetMediaSeoResponse,
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
  handleUploadInserts: () => Promise<void>;
  handleRemove: (index: number) => void;
  updateMediaUpload: (index: number, mediaUpload: UploadMedia) => void;
  uploadSingleMedia: (index: number) => Promise<void>;
  generateSeoSingleMedia: (media: Media) => ReturnType<typeof getMediaSeoAction>;
  generateManySeoMedia: (media: Media[]) => Promise<void>;
  getMediaUploadByMediaId: (mediaId: number) => UploadMedia | undefined;
  setMediUploadByMediaId: (mediaId: number, mediaUpload: UploadMedia) => void;
  deleteMediaUploadByMediaId: (mediaId: number) => void;
  isLoading: boolean;
  isCompleted: boolean;
  completed: UploadMedia[];
  mediaPendingToUpdate: UploadMedia[];
  mediaPendingToCreate: UploadMedia[];
  isMediaCompleted: (m: UploadMedia) => boolean;
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

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const isMediaCompleted = (m: UploadMedia): boolean => !m.pending && !!(m.data || m.error);

  const updateUploadByIndex = (
    index: number,
    updates: Partial<Pick<UploadMedia, 'pending' | 'data' | 'error'>>
  ) => {
    setMediaUploads((prev) => {
      const currentMedia = prev[index];
      if (!currentMedia) return prev;
      return prev.map((upload, i) =>
        i === index ? { ...upload, ...updates } : upload
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

  const getMediaUploadByMediaId = useCallback((mediaId: number): UploadMedia | undefined => {
    return mediaUploads.find(m => m.id === mediaId || m.data?.id === mediaId);
  }, [mediaUploads]);

  const setMediUploadByMediaId = useCallback((mediaId: number, mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      // Find index of existing media with the same ID
      const existingIndex = prev.findIndex(m => m.id === mediaId || m.data?.id === mediaId);

      if (existingIndex !== -1) {
        // Revoke old preview URL if it exists and is different
        const existingUpload = prev[existingIndex];
        if (existingUpload.previewUrl &&
          existingUpload.previewUrl.startsWith('blob:') &&
          existingUpload.previewUrl !== mediaUpload.previewUrl) {
          URL.revokeObjectURL(existingUpload.previewUrl);
        }

        // Replace the existing media upload
        return prev.map((upload, index) =>
          index === existingIndex ? mediaUpload : upload
        );
      } else {
        // Add new media upload if it doesn't exist
        return [...prev, mediaUpload];
      }
    });
  }, []);

  const deleteMediaUploadByMediaId = useCallback((mediaId: number) => {
    setMediaUploads((prev) => {
      // Find index of existing media with the same ID
      const existingIndex = prev.findIndex(m => m.id === mediaId || m.data?.id === mediaId);

      if (existingIndex !== -1) {
        const uploadToRemove = prev[existingIndex];
        // Revoke blob URL if it exists
        if (uploadToRemove?.previewUrl && uploadToRemove.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(uploadToRemove.previewUrl);
        }
        // Remove the media upload
        return prev.filter((_, i) => i !== existingIndex);
      }
      return prev;
    });
  }, []);

  const addMediaUploads = useCallback(
    (mediaInput: (CreateMediaInputWithFile & { previewUrl?: string })[]) => {
      setMediaUploads((prev) => [
        ...prev,
        ...mediaInput.map(({ previewUrl, ...input }) => ({
          input,
          previewUrl,
          pending: false,
        })),
      ]);
    },
    []
  );

  const pushMediaUpload = useCallback((mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      if (!mediaUpload.id) {
        // If it has no id, just append
        return [...prev, mediaUpload];
      }

      const existingIndex = prev.findIndex(
        (m) => m.id === mediaUpload.id || m.data?.id === mediaUpload.id
      );

      if (existingIndex === -1) {
        return [...prev, mediaUpload];
      }

      return prev;
    });
  }, []);

  const setMediaUploadsDirect = useCallback((mediaUploads: UploadMedia[]) => {
    setMediaUploads(mediaUploads);
  }, []);

  const handleRemove = (index: number) => {
    setMediaUploads((prev) => {
      const uploadToRemove = prev[index];
      // Revoke blob URL if it exists
      if (uploadToRemove?.previewUrl && uploadToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadToRemove.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveCompleted = () => {
    setMediaUploads((prev) => {
      // Revoke any blob URLs to prevent memory leaks
      return prev.filter((upload) => {
        const toRemove = !upload.pending && (upload.data || upload.error || upload.seoData)
        if (toRemove && upload.previewUrl && upload.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(upload.previewUrl);
        }
        return !toRemove;
      });
    });
  };

  const updateMediaUpload = (index: number, mediaUpload: UploadMedia) => {
    setMediaUploads((prev) => {
      if (!prev[index]) return prev;
      return prev.map((currentMedia, i) => i === index ? { ...mediaUpload } : currentMedia);
    });
  }

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const isLoading = useMemo(() => mediaUploads.some(m => m.pending), [mediaUploads]);
  const completed: UploadMedia[] = useMemo(() => mediaUploads.filter(m => isMediaCompleted(m)), [mediaUploads]);
  const isCompleted = useMemo(()=>!mediaUploads.some(m=>!isMediaCompleted(m)),[mediaUploads]);
  const mediaPendingToUpdate = useMemo(() => mediaUploads.filter(m => !!m.id && !isMediaCompleted(m)), [mediaUploads]);
  const mediaPendingToCreate = useMemo(() => mediaUploads.filter(m => !m.id && !isMediaCompleted(m)), [mediaUploads]);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const uploadSingleMedia = async (index: number) => {
    const media = mediaUploads[index]
    if (!media) return;
    // Check current state before proceeding
    setMediaUploads((prev) => {
      const currentMedia = prev[index];
      if (!currentMedia || currentMedia.pending || currentMedia.error || currentMedia.data) {
        return prev; // No update needed
      }
      // Set to pending
      return prev.map((upload, i) =>
        i === index
          ? { ...upload, pending: true, error: undefined }
          : upload
      );
    });

    try {
      let result: Awaited<ReturnType<typeof createMediaAction>> | Awaited<ReturnType<typeof updateMediaAction>>;

      if (media.id) {
        // Extract only updateable fields (exclude file)
        const { file, ...updateInput } = media.input;
        result = await updateMediaAction(media.id, updateInput as UpdateMediaInput);
      } else {
        result = await createMediaAction(media.input);
      }

      if (result.data) {
        // Success - store the media data
        if (media.onSuccess) {
          await media.onSuccess(result.data)
        }
        updateUploadByIndex(index, {
          pending: false,
          data: result.data,
          error: undefined
        });
      } else {
        // Failed with errors
        const returnError = extractReturnError(result);
        updateUploadByIndex(index, {
          pending: false,
          data: undefined,
          error: returnError
        });
      }
    } catch (error) {
      // Failed with exception
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      updateUploadByIndex(index, {
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
    const currentMediaUpload = getMediaUploadByMediaId(media.id);
    // Base upload (existing or derived from current media)
    const baseUpload: UploadMedia = currentMediaUpload || {
      input: {
        user_id: media.user_id,
        title: media.title || undefined,
        description: media.description || undefined,
        seo_title: media.seo_title || undefined,
        seo_description: media.seo_description || undefined,
        seo_alt: media.seo_alt || undefined,
        seo_filename: media.seo_filename || '',
      },
      previewUrl: media.thumbnail || undefined,
      id: media.id,
      pending: false,
    };

    // Mark upload as pending before calling AI
    setMediUploadByMediaId(media.id, {
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

      if (!result.data?.seo) {
        // Failed with errors from backend
        const error = {
          errors: result.errors && result.errors.length > 0 ? result.errors : ['Failed to generate SEO'],
          inputErrors: result.inputErrors,
        };

        setMediUploadByMediaId(media.id, {
          ...baseUpload,
          pending: false,
          data: undefined,
          error,
          previewUrl: media.thumbnail || undefined,
        });

        return result;
      }

      const seo = result.data.seo;

      const updatedUpload: UploadMedia = {
        ...baseUpload,
        pending: false,
        error: undefined,
        data: undefined,
        seoData: result.data,
        previewUrl: media.thumbnail || undefined,
        input: {
          ...baseUpload.input,
          seo_title: seo.seo_title || baseUpload.input.seo_title,
          seo_description: seo.seo_description || baseUpload.input.seo_description,
          seo_alt: seo.seo_alt || baseUpload.input.seo_alt,
          seo_filename: seo.seo_filename || baseUpload.input.seo_filename,
        },
      };

      setMediUploadByMediaId(media.id, updatedUpload);

      if (onSuccess) {
        await onSuccess(result, media);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';

      setMediUploadByMediaId(media.id, {
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

  const generateManySeoMedia = async (media: Media[], onSuccess?: (successfulResults: Array<{ result: Awaited<ReturnType<typeof getMediaSeoAction>>, media: Media }>) => Promise<void>) => {
    const successfulResults: Array<{ result: Awaited<ReturnType<typeof getMediaSeoAction>>, media: Media }> = [];

    await Promise.all(
      media.map(m =>
        generateSeoSingleMedia(m, async (result, media) => {
          if (result.data?.seo) {
            successfulResults.push({ result, media });
          }
        })
      )
    );

    if (onSuccess && successfulResults.length > 0) {
      await onSuccess(successfulResults);
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  const handleUpload = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();


    await Promise.all(
      mediaUploads.map((_, index) =>
        uploadSingleMedia(index)
      )
    );

  }

  const handleUploadUpdates = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    const indicesToUpdate = mediaUploads
      .map((m, index) => ({ m, index }))
            //If media has ID update
      .filter(({ m }) => !!m.id && !m.pending && !m.data && !m.error)
      .map(({ index }) => index);


    await Promise.all(
      indicesToUpdate.map(index =>
        uploadSingleMedia(index)
      )
    );

  }
  const handleUploadInserts = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();

    const indicesToUpdate = mediaUploads
      .map((m, index) => ({ m, index }))
      //If media does not have ID is a insert
      .filter(({ m }) => !m.id && !m.pending && !m.data && !m.error)
      .map(({ index }) => index);


    await Promise.all(
      indicesToUpdate.map(index =>
        uploadSingleMedia(index)
      )
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
    handleRemove,
    updateMediaUpload,
    uploadSingleMedia,
    generateSeoSingleMedia,
    generateManySeoMedia,
    getMediaUploadByMediaId,
    setMediUploadByMediaId,
    deleteMediaUploadByMediaId,
    isLoading,
    isCompleted,
    completed,
    mediaPendingToUpdate,
    mediaPendingToCreate,
    isMediaCompleted,
    handleUpload,
    handleUploadUpdates,
    handleUploadInserts
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};

export default MediaProvider;
