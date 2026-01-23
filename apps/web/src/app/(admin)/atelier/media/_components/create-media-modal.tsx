"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/shadcn/dialog"
import { Button } from "@repo/ui/components/shadcn/button"
import { FileInput } from "@repo/ui/components/custom/file-input"
import { useInputFile } from "@repo/ui/contexts/file.provider"
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls"
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants"
import { useMedia } from "@/modules/media/providers/media.provider"
import { CreateMediaInputWithFile } from "@repo/common-lib/types/media"
import { useSession } from "@/lib/hooks/useSession"

function MediaUploadContent() {
    const MAX_FILES = 10;
    const [error, setError] = useState<string>();
    const { mediaUploads } = useMedia()
    const currentCount = mediaUploads?.length || 0;
    const isMaxReached = currentCount >= MAX_FILES;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (!selectedFiles || !selectedFiles.length) {
            setError(undefined)
            return
        }

        const remainingSlots = MAX_FILES - currentCount;
        if (selectedFiles.length > remainingSlots) {
            setError(`Maximum ${MAX_FILES} files allowed. You can add ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'}.`)
            e.target.value = ""
            return
        }

        setError(undefined)
    }
    
    return (
        <div className="h-full flex flex-col p-4">
            {mediaUploads && mediaUploads.length > 0 ? (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                            {currentCount}/{MAX_FILES} files
                        </span>
                        {isMaxReached && (
                            <span className="text-xs text-amber-600">Maximum reached</span>
                        )}
                    </div>
                    <div className="mb-4 overflow-y-auto flex-1 min-h-0">
                        <div className="grid grid-cols-3 gap-3">
                            {mediaUploads.map((media, index) => (
                                <div
                                    key={index}
                                    className="aspect-square flex items-center justify-center overflow-hidden rounded-md border border-border bg-fg-2"
                                >
                                    <img
                                        src={media.previewUrl}
                                        alt={`Preview ${index + 1}`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 mb-2">{error}</p>
                    )}
                    <FileInput
                        multiple
                        onChange={handleFileChange}
                        accept={ALLOWED_IMAGE_FILE_TYPES.join(',')}
                        disabled={isMaxReached}
                    />
                </>
            ) : (
                <div className="h-full flex flex-col">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-text-muted">
                            {currentCount}/{MAX_FILES} files
                        </span>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 mb-2">{error}</p>
                    )}
                    <div className="flex-1 min-h-0">
                        <FileInput
                            multiple
                            onChange={handleFileChange}
                            accept={ALLOWED_IMAGE_FILE_TYPES.join(',')}
                            className="h-full [&>div]:h-full [&_label]:h-full [&_label]:min-h-0"
                            disabled={isMaxReached}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export function CreateMediaDialog() {
    const [open, setOpen] = useState(false)
    const { handleUpload, isLoading, handleCancel, setMediaUploads } = useMedia()
    const { files } = useInputFile()
    const { previewUrls, cleanup } = usePreviewUrls({ files });
    const { session } = useSession();
    
    useEffect(() => {
        if (!previewUrls || !previewUrls.length || !files || !files.length || !session || files.length !== previewUrls.length) return;

        const newMediaUploads: (CreateMediaInputWithFile & { previewUrl?: string })[] = []
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const previewUrl = previewUrls[i]
            newMediaUploads.push({
                file,
                previewUrl,
                seo_filename: file.name,
                user_id: session.id
            })
        }
        
        setMediaUploads(newMediaUploads)

    }, [previewUrls, files, session, setMediaUploads])

    useEffect(()=>{
        if(!isLoading)return

        setOpen(false)
    },[isLoading])
    if (!session) return null;

    return (

        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button variant="default" size="default">
                    Create New Media
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[90vh] flex flex-col [&>button]:hidden p-0">
                <DialogHeader className="border-b pb-4 px-6 pt-6">
                    <DialogTitle>Create New Media</DialogTitle>
                    <DialogDescription>
                        Upload up to 10 images (JPEG, PNG, WebP)
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0">
                    <MediaUploadContent />
                </div>
                <DialogFooter className="border-t pt-4 px-6 pb-6 w-full">
                    <DialogClose asChild>
                        <Button onClick={() => {
                         handleCancel()
                         cleanup()
                         setOpen(false)
                        }} variant="outline" className="w-full">
                            Close
                        </Button>
                    </DialogClose>
                    {files?.length ? <Button onClick={async () => {
                        setOpen(false)
                        await handleUpload()
                    }} variant={'secondary'} className="w-full">Upload!</Button> : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

