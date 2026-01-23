'use client'

import { UploadMedia, useMedia } from "../providers/media.provider";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@repo/ui/components/shadcn/hover-card";
import { CircleCheckIcon, OctagonXIcon, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { Button } from "@repo/ui/components/shadcn/button";
import { useMemo, useState } from "react";


export const UploadMediaModal = ()=>{

    const [compact, setCompact] = useState(false);
    const {mediaUploads,isCompleted, handleCancel} = useMedia();
    const pendingLength = useMemo(()=> mediaUploads.filter(m=>m.pending).length,[mediaUploads]);
    const successCount = useMemo(()=> mediaUploads.filter(m=>m.data).length,[mediaUploads]);
    const failedCount = useMemo(()=> mediaUploads.filter(m=>m.error).length,[mediaUploads]);

    if(!mediaUploads.length) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[400px] flex flex-col overflow-hidden rounded-lg border border-border bg-fg shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-semibold">
                        {isCompleted ? 'Upload complete' : 'Uploading files'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        {pendingLength > 0 && (
                            <span>{pendingLength} {pendingLength === 1 ? 'remaining' : 'remaining'}</span>
                        )}
                        {successCount > 0 && (
                            <span className="text-green-600">
                                {successCount} {successCount === 1 ? 'success' : 'success'}
                            </span>
                        )}
                        {failedCount > 0 && (
                            <span className="text-red-600">
                                {failedCount} {failedCount === 1 ? 'failed' : 'failed'}
                            </span>
                        )}
                        {isCompleted && pendingLength === 0 && successCount > 0 && failedCount === 0 && (
                            <span className="text-green-600">All complete</span>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCompact(!compact)}
                >
                    {compact ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out flex-1 min-h-0 ${
                    compact 
                        ? 'max-h-0 opacity-0' 
                        : 'opacity-100'
                }`}
            >
                <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                    <div className=" h-f flex flex-col items-start justify-start gap-3 px-4 pt-4 pb-40 ">
                        {mediaUploads.map((mediaUpload,i) => (
                            <CreateSingleMedia 
                                key={`media-uploading-${mediaUpload.input.file?.name}-${i}`}
                                mediaUpload={mediaUpload} 
                             
                            />
                        ))}
                    </div>
                </div>
            </div>
            {isCompleted && (
                <div className="border-t border-border px-4 py-3 shrink-0">
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={handleCancel}
                    >
                        Close
                    </Button>
                </div>
            )}
        </div>
    );
}

const CreateSingleMedia = ({mediaUpload}:{
    
    mediaUpload:UploadMedia,

})=>{


  const statusIcon = mediaUpload.pending ? (
    <Spinner className="size-5 text-blue-500" />
  ) : mediaUpload.data ? (
    <CircleCheckIcon className="size-5 text-green-500" />
  ) : mediaUpload.error ? (
    <OctagonXIcon className="size-5 text-red-500" />
  ) : null;

  const statusText = mediaUpload.pending 
    ? "Uploading..." 
    : mediaUpload.data 
    ? "Upload successful" 
    : mediaUpload.error 
    ? "Upload failed" 
    : "Ready to upload";

  const errorMessage = mediaUpload.error?.message;

    if(!mediaUpload.previewUrl) return (
        <div className="flex items-center gap-3 p-2">
            <Spinner className="size-8" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                    {mediaUpload.input.file?.name || "Loading..."}
                </p>
                <p className="text-xs text-text-muted">Preparing upload...</p>
            </div>
        </div>
    );

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-fg-2 transition-colors cursor-pointer">
          <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border border-border bg-fg-2">
            {mediaUpload.previewUrl ? (
              <img 
                src={mediaUpload.previewUrl} 
                alt="Preview" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted text-xs">
                No preview
              </div>
            )}
            {statusIcon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                {statusIcon}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {mediaUpload.input.file?.name || "Unknown file"}
            </p>
            <p className="text-xs text-text-muted">{statusText}</p>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {statusIcon}
            <p className="text-sm font-medium">{statusText}</p>
          </div>
          {errorMessage && (
            <p className="text-xs text-red-500">{errorMessage}</p>
          )}
          {mediaUpload.input.file && (
            <p className="text-xs text-text-muted">
              {mediaUpload.input.file.name}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}