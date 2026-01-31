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
import { Slider } from "@repo/ui/components/shadcn/slider"
import { DEFAULT_COMPRESSION_LVL, ENUMS, EnumType } from "@repo/common-lib/constants/enums"
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip"
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider"

function MediaUploadContent() {
    const COMPRESSION_LVLS = ENUMS.COMPRESSION_LEVEL;
    const MAX_FILES = 10;
    const [error, setError] = useState<string>();
    const [globalCompressionLevel, setGlobalCompressionLevel] = useState<EnumType<'COMPRESSION_LEVEL'>>(DEFAULT_COMPRESSION_LVL);
    const { mediaPendingToCreate, updateMediaUpload, setMediaUploads } = useMedia();
    const {metrics} = useUserMetrics();
    const allow_media_compression = metrics?.active_plan.allow_media_compression;
    const currentCount = mediaPendingToCreate?.length || 0;
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
    const getCompressionLvlIndex = (compressionLvl: EnumType<'COMPRESSION_LEVEL'>) => {

        for (let i = 0; i < COMPRESSION_LVLS.length; i++) {
            if (compressionLvl === COMPRESSION_LVLS[i]) {
                return i;
            }
        }
        return COMPRESSION_LVLS.length - 2;

    }

    return (
        <div className="h-full flex flex-col p-2">
            {mediaPendingToCreate && mediaPendingToCreate.length > 0 ? (
                <>
                    <div className="mb-4 space-y-3 p-1 rounded-md border border-border bg-fg-1/50">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text">Global Compression</span>
                                        <InfoTooltip 
                                            content={
                                                <div className="space-y-2">
                                                    <p className="font-medium">Compression Level</p>
                                                    <p className="text-sm">
                                                        Controls the balance between image quality and file size. Lower compression (VERY_LOW, LOW) preserves more detail but creates larger files. Higher compression (HIGH, VERY_HIGH) reduces file size but may slightly reduce image quality.
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        This setting applies to all uploaded files. You can adjust individual files using the sliders below.
                                                    </p>
                                                </div>
                                            } 
                                        />
                                        <span className="text-xs text-text-muted bg-fg-2 px-2 py-0.5 rounded-md">
                                            All files
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-text bg-accent/20 px-2 py-1 rounded-md">
                                        {globalCompressionLevel}
                                    </span>
                                </div>
                                {!allow_media_compression && (
                                    <div className="mb-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-xs text-amber-600">
                                            <span className="font-medium">Upgrade required:</span> Compression control is not available in your current plan. Upgrade to access this feature.
                                        </p>
                                    </div>
                                )}
                                <Slider

                                    defaultValue={[getCompressionLvlIndex(DEFAULT_COMPRESSION_LVL)]}
                                    max={COMPRESSION_LVLS.length - 1}
                                    min={0}
                                    step={1}
                                    disabled={!allow_media_compression}
                                    onValueChange={(e) => {
                                        if (!allow_media_compression) return;
                                        const compressionLvlSelected = COMPRESSION_LVLS[e[0]]
                                        if (!compressionLvlSelected) return;
                                        setGlobalCompressionLevel(compressionLvlSelected)
                                        setMediaUploads(mediaPendingToCreate.map(mu=>{
                                            return {
                                                ...mu,
                                                input:{
                                                    ...mu.input,
                                                    compression_level:compressionLvlSelected
                                                }
                                            }
                                        }))

                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <span className="text-sm text-text-muted">
                                {currentCount}/{MAX_FILES} files
                            </span>
                            {isMaxReached && (
                                <span className="text-xs text-amber-600">Maximum reached</span>
                            )}
                        </div>
                    </div>
                    <div className="mb-4 overflow-y-auto flex-1 min-h-0">
                        <div className="grid grid-cols-2 gap-4">
                            {mediaPendingToCreate.map((media, index) => {

                                const currentCompressionLvl = media.input.compression_level || DEFAULT_COMPRESSION_LVL;


                                return (
                                    <div key={`media-upload-${media.input.file?.name}-${index}`} className="flex flex-col gap-3">
                                        <div
                                            className="aspect-square flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-fg-2 shadow-md min-h-[200px]"
                                        >
                                            <img
                                                src={media.previewUrl}
                                                alt={`Preview ${index + 1}`}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 px-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-text-muted font-medium">Compression</span>
                                                <span className="text-xs font-semibold text-text bg-fg-1 px-2 py-0.5 rounded-md">{currentCompressionLvl}</span>
                                            </div>
                                            {!allow_media_compression && (
                                                <p className="text-xs text-amber-600">
                                                    Upgrade plan to adjust
                                                </p>
                                            )}
                                            <Slider
                                                value={[getCompressionLvlIndex(currentCompressionLvl)]}
                                                max={COMPRESSION_LVLS.length - 1}
                                                min={0}
                                                step={1}
                                                disabled={!allow_media_compression}
                                                onValueChange={(e) => {
                                                    if (!allow_media_compression) return;
                                                    const compressionLvlSelected = COMPRESSION_LVLS[e[0]]
                                                    if (!compressionLvlSelected) return;

                                                    updateMediaUpload(index, {
                                                        ...media,
                                                        input: {
                                                            ...media.input,
                                                            compression_level: compressionLvlSelected
                                                        }
                                                    })
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 mb-2">{error}</p>
                    )}
                    <div className="mt-auto">
                        <FileInput
                            multiple
                            onChange={handleFileChange}
                            accept={ALLOWED_IMAGE_FILE_TYPES.join(',')}
                            disabled={isMaxReached}

                        />
                    </div>
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
    const { handleUpload, isLoading, handleRemoveCompleted, addMediaUploads } = useMedia()
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

        addMediaUploads(newMediaUploads)

    }, [previewUrls, files, session, addMediaUploads])

    useEffect(() => {
        if (!isLoading) return

        setOpen(false)
    }, [isLoading])
    if (!session) return null;

    return (

        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button variant="default" size="default">
                    Create New Media
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[95vh] flex flex-col justify-between [&>button]:hidden p-0 z-100">
                <DialogHeader className="border-b pb-4 px-6 pt-6">
                    <DialogTitle>Create New Media</DialogTitle>
                    <DialogDescription>
                        Upload up to 10 images (JPEG, PNG, WebP)
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0">
                    <MediaUploadContent />
                </div>
                <DialogFooter className="border-t p-2 full">
                    <DialogClose asChild>
                        <Button onClick={() => {
                            handleRemoveCompleted()
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

