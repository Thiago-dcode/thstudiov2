"use client";

import { CreateMediaInputWithFile, Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { createContext, useContext, ReactNode, useState, useMemo, useCallback } from "react";
import { createMediaAction } from "../server-actions/create-media.action";
import { updateMediaAction } from "../server-actions/update-media.action";
import { ReturnError } from "@/modules/auth/auth.types";


export type UploadMedia = {
  input:CreateMediaInputWithFile,
  //If has id is an update
  id?:number,
  previewUrl?:string,
  pending:boolean,
  data?:Media,
  onSuccess?:(media:Media)=>Promise<void>
  error?:ReturnError
  
}
// Context type
type MediaContextType = {
  mediaUploads: UploadMedia[];
  addMediaUploads: (mediaInput: (CreateMediaInputWithFile & {previewUrl?:string})[]) => void;
  setMediaUploads: (mediaUploads: UploadMedia[]) => void;
  handleCancel: () => void;
  handleUpload:  ()=>Promise<void>;
  handleUploadUpdates:  ()=>Promise<void>;
  handleRemove: (index: number) => void;
  updateMediaUpload: (index: number, mediaUpload: UploadMedia) => void;
  uploadSingleMedia: (media: UploadMedia, index: number) => Promise<void>;
  getMediaUploadByMediaId: (mediaId: number) => UploadMedia | undefined;
  setMediUploadByMediaId: (mediaId: number, mediaUpload: UploadMedia) => void;
  deleteMediaUploadByMediaId: (mediaId: number) => void;
  isLoading: boolean;
  isCompleted:boolean;
  mediaPendingToUpdate: UploadMedia[];

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

  const getMediaUploadByMediaId = useCallback((mediaId: number): UploadMedia | undefined => {
    return mediaUploads.find(m => m.id === mediaId || m.data?.id === mediaId);
  }, [mediaUploads]);
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
  const mediaPendingToUpdate = useMemo(()=>mediaUploads.filter(m=>!!m.id && !m.pending),[mediaUploads])

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

  // Helper to extract ReturnError from result
  const extractReturnError = (
    result: Awaited<ReturnType<typeof createMediaAction>> | Awaited<ReturnType<typeof updateMediaAction>>
  ): ReturnError => {
    return {
      errors: result.errors && result.errors.length > 0 ? result.errors : ['Upload failed'],
      inputErrors: result.inputErrors
    };
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
        if(media.onSuccess){
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



  const handleUpload = async () => {
    if (!mediaUploads.length || isLoading) return Promise.resolve();
  
    await Promise.all(mediaUploads.map(uploadSingleMedia));
  }
  const handleUploadUpdates = async ()=>{

    if (!mediaUploads.length || isLoading) return Promise.resolve();
  
    await Promise.all(mediaUploads.filter(m=>!!m.id).map(uploadSingleMedia));
    
  }

  const value: MediaContextType = {
    mediaUploads,
    addMediaUploads,
    setMediaUploads: setMediaUploadsDirect,
    handleCancel,
    handleRemove,
    updateMediaUpload,
    uploadSingleMedia,
    getMediaUploadByMediaId,
    setMediUploadByMediaId,
    deleteMediaUploadByMediaId,
    isLoading,
    isCompleted,
    mediaPendingToUpdate,
    handleUpload,
    handleUploadUpdates
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};

export default MediaProvider;
