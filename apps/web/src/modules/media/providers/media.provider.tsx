"use client";

import { CreateMediaInputWithFile, Media } from "@repo/common-lib/types/media";
import { createContext, useContext, ReactNode, useState, useMemo, useCallback } from "react";
import { createMediaAction } from "../server-actions/create-media.action";


export type UploadMedia = {
  input:CreateMediaInputWithFile,
  previewUrl?:string,
  pending:boolean,
  data?:Media,
  error?:{
    message:string
  },
  
}
// Context type
type MediaContextType = {
  mediaUploads: UploadMedia[];
  addMediaUploads: (mediaInput: (CreateMediaInputWithFile & {previewUrl?:string})[]) => void;
  setMediaUploads: (mediaUploads: UploadMedia[]) => void;
  handleCancel: () => void;
  handleUpload:  ()=>Promise<void>;
  handleRemove: (index: number) => void;
  updateMediaUpload: (index: number, mediaUpload: UploadMedia) => void;
  isLoading: boolean;
  isCompleted:boolean

};

const MediaContext = createContext<MediaContextType | null>(null);

// Hook to use media context
export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};

// Provider component
export const MediaProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [mediaUploads, setMediaUploads] = useState<UploadMedia[]>([]);




  const handleCancel = () => {
    setMediaUploads((prev) => {
      // Revoke any blob URLs to prevent memory leaks
      prev.forEach((upload) => {
        if (upload.previewUrl && upload.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(upload.previewUrl);
        }
      });
      return [];
    });
  };

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

  const addMediaUploads = useCallback((mediaInput: (CreateMediaInputWithFile & {previewUrl?:string})[]) => {
    const MAX_FILES = 10;
    setMediaUploads((prev) => {
      // Limit input to MAX_FILES
      const limitedInput = mediaInput.slice(0, MAX_FILES);
      
      // Check if the new input is actually different to prevent unnecessary updates
      const newUploads = limitedInput.map(({ previewUrl, ...input}) => ({
        input,
        previewUrl,
        pending: false
      }));
      
      // Compare by file name and preview URL to avoid unnecessary updates
      if (prev.length === newUploads.length) {
        const isSame = prev.every((upload, index) => {
          const newUpload = newUploads[index];
          return upload.input.file?.name === newUpload.input.file?.name &&
                 upload.previewUrl === newUpload.previewUrl;
        });
        if (isSame) return prev;
      }
      
      return newUploads;
    });
  }, []);

  const setMediaUploadsDirect = useCallback((mediaUploads: UploadMedia[]) => {
    setMediaUploads(mediaUploads);
  }, []);
  const isLoading = useMemo(() => mediaUploads.some(m => m.pending), [mediaUploads]);
  const isCompleted = useMemo(() => !mediaUploads.some(m => !m.data && !m.error), [mediaUploads]);

  const updateMediaUpload = (index:number, mediaUpload:UploadMedia)=>{
    setMediaUploads((prev) => {
      if(!prev[index]) return prev;
      return prev.map((currentMedia,i)=>i===index?{...mediaUpload}:currentMedia);
    });
  }

  // Helper to update a single upload by index with partial updates
  const updateUploadByIndex = (
    index: number,
    updates: Partial<Pick<UploadMedia, 'pending' | 'data' | 'error'>>
  ) => {
    setMediaUploads((prev) => {
      const currentMedia = prev[index];
      if(!currentMedia) return prev;
      return prev.map((upload, i) => 
        i === index ? { ...upload, ...updates } : upload
      );
    });
  };

  // Helper to extract error message from result
  const extractErrorMessage = (result: Awaited<ReturnType<typeof createMediaAction>>): string => {
    const errorMessages: string[] = [];
    
    if (result.errors && result.errors.length > 0) {
      errorMessages.push(...result.errors);
    }
    
    if (result.inputErrors) {
      errorMessages.push(...Object.values(result.inputErrors));
    }

    return errorMessages.length > 0 
      ? errorMessages.join(', ')
      : 'Upload failed';
  };

  const uploadSingleMedia = async (media:UploadMedia,index:number)=>{
    // Check current state before proceeding
    setMediaUploads((prev) => {
      const currentMedia = prev[index];
      if(!currentMedia || currentMedia.pending || currentMedia.error || currentMedia.data) {
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
      const result = await createMediaAction(media.input);

      if (result.data) {
        // Success - store the media data
        updateUploadByIndex(index, {
          pending: false,
          data: result.data,
          error: undefined
        });
      } else {
        // Failed with errors
        const errorMessage = extractErrorMessage(result);
        updateUploadByIndex(index, {
          pending: false,
          data: undefined,
          error: { message: errorMessage }
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
        error: { message: errorMessage }
      });
    }
  }

  const handleUpload = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();
  
    await Promise.all(mediaUploads.map(uploadSingleMedia));
  }

  const value: MediaContextType = {
    mediaUploads,
    addMediaUploads,
    setMediaUploads: setMediaUploadsDirect,
    handleCancel,
    handleRemove,
    updateMediaUpload,
    isLoading,
    isCompleted,
    handleUpload
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};

export default MediaProvider;
