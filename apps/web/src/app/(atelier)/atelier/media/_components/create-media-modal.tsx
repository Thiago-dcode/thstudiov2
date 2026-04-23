"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
import { CreateMediaInputWithFile, Media } from "@repo/common-lib/types/media"
import { useSession } from "@/lib/hooks/useSession"
import { Slider } from "@repo/ui/components/shadcn/slider"
import { DEFAULT_COMPRESSION_LVL, ENUMS, EnumType } from "@repo/common-lib/constants/enums"
import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip"
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider"
import { Checkbox } from "@repo/ui/components/shadcn/checkbox"
import { Plus, Sparkles, X } from "lucide-react"

function MediaUploadContent() {
    const COMPRESSION_LVLS = ENUMS.COMPRESSION_LEVEL;
    const MAX_FILES = 15;
    const [error, setError] = useState<string>();
    const [globalCompressionLevel, setGlobalCompressionLevel] = useState<EnumType<'COMPRESSION_LEVEL'>>(DEFAULT_COMPRESSION_LVL);
    const { mediaPendingToCreate, upsertMediaUpload, removeMediaUpload, setMediaUploads } = useMedia();
    const { metrics, aiCreditsInfo } = useUserMetrics();
    const allow_media_compression = metrics?.active_plan.allow_media_compression;
    const currentCount = mediaPendingToCreate?.length || 0;
    const isMaxReached = currentCount >= MAX_FILES;
    const mediaToShow = useMemo(()=>mediaPendingToCreate.filter(m=>!m.pending && !m.data && !m.error),[mediaPendingToCreate]);

    const [generateSeo, setGenerateSeo] = useState(false);
    const remainingCredits = aiCreditsInfo ? aiCreditsInfo.total - aiCreditsInfo.consumed : 0;
    const hasCredits = remainingCredits > 0;

    useEffect(() => {
        const needsUpdate = mediaToShow.some(m => m.generate_seo !== generateSeo);
        if (!needsUpdate) return;
        setMediaUploads(mediaPendingToCreate.map(mu => ({
            ...mu,
            generate_seo: generateSeo
        })));
    }, [mediaToShow.length, generateSeo]);

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
            {mediaToShow && mediaToShow.length > 0 ? (
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
                                        setMediaUploads(mediaPendingToCreate.map(mu => {
                                            return {
                                                ...mu,
                                                input: {
                                                    ...mu.input,
                                                    compression_level: compressionLvlSelected
                                                }
                                            }
                                        }))

                                    }}
                                />
                            </div>
                        </div>
                        <div className="pt-2 border-t border-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="generate-seo"
                                        checked={generateSeo}
                                        disabled={!hasCredits}
                                        onCheckedChange={(checked) => {
                                            const value = checked === true;
                                            setGenerateSeo(value);
                                            setMediaUploads(mediaPendingToCreate.map(mu => ({
                                                ...mu,
                                                generate_seo: value
                                            })));
                                        }}
                                    />
                                    <label htmlFor="generate-seo" className="flex items-center gap-1.5 text-sm font-medium text-text cursor-pointer select-none">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AI SEO Generation
                                    </label>
                                    <InfoTooltip
                                        content={
                                            <div className="space-y-2">
                                                <p className="font-medium">AI SEO Generation</p>
                                                <p className="text-sm">
                                                    Automatically generates SEO title, description, alt text, and filename for each image using AI vision analysis.
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Costs 1 AI credit per image. You have {remainingCredits} credit{remainingCredits !== 1 ? 's' : ''} remaining.
                                                </p>
                                            </div>
                                        }
                                    />
                                </div>
                                <span className="text-xs font-semibold text-text bg-accent/20 px-2 py-1 rounded-md">
                                    {remainingCredits} credit{remainingCredits !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {!hasCredits && (
                                <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-xs text-amber-600">
                                        <span className="font-medium">No AI credits:</span> You have used all your AI credits. Upgrade your plan or wait for the next reset.
                                    </p>
                                </div>
                            )}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mediaPendingToCreate.map((media, index) => {

                                const currentCompressionLvl = media.input.compression_level || DEFAULT_COMPRESSION_LVL;


                                return (
                                    <div key={`media-upload-${media.input.file?.name}-${index}`} className="flex flex-col gap-3">
                                        <div
                                            className="relative aspect-square flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-fg-2 shadow-md min-h-[200px]"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => removeMediaUpload(media.unique_id)}
                                                className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
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

                                                    upsertMediaUpload({
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
                            currentFiles={currentCount}
                            maxFiles={MAX_FILES}
                            className="py-2 gap-1 min-h-0 [&_svg]:h-5 [&_svg]:w-5"
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
                            currentFiles={currentCount}
                            maxFiles={MAX_FILES}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export function CreateMediaDialog({onSuccess}:{
    onSuccess?: (media:Media)=>void
}) {
    const [open, setOpen] = useState(false)
    const { handleUploadInserts, isLoading, handleRemoveCompleted, addMediaUploads } = useMedia()
    const { files } = useInputFile()
    const { previewUrls, cleanup } = usePreviewUrls({ files });
    const { session } = useSession();
    const { metrics } = useUserMetrics();

    const storageUsed = metrics?.extra_data.storage_used_mb ?? 0;
    const storageLimit = metrics?.active_plan.storage_limit_mb ?? 0;
    const isStorageFull = storageLimit > 0 && storageUsed >= storageLimit;

    const addedFilesRef = useRef(new Set<File>());

    useEffect(() => {
        if (!previewUrls || !previewUrls.length || !files || !files.length || !session || files.length !== previewUrls.length) return;

        const newMediaUploads: (CreateMediaInputWithFile & { previewUrl?: string })[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (addedFilesRef.current.has(file)) continue;
            addedFilesRef.current.add(file);
            const previewUrl = previewUrls[i]
            newMediaUploads.push({
                file,
                previewUrl,
                seo_filename: file.name,
                user_id: session.id
            })
        }

        if (newMediaUploads.length > 0) {
            addMediaUploads(newMediaUploads)
        }

    }, [previewUrls, files, session, addMediaUploads])

    useEffect(() => {
        if (!isLoading) return

        setOpen(false)
    }, [isLoading])
    if (!session) return null;

    if (isStorageFull) {
        return (
            <Button className="p-2 text-sm" variant="secondary" size="default" disabled
                title={`Storage full: ${(storageUsed / 1024).toFixed(1)} / ${(storageLimit / 1024).toFixed(1)} GB used`}
            >
                <Plus className="h-4 w-4" />
                Create media
            </Button>
        );
    }

    return (

        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button className="p-2 text-sm " variant="secondary" size="default">
                    <Plus className="h-4 w-4" />
                    Create media
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl h-[95vh] flex flex-col justify-between [&>button]:hidden p-0 z-100">
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
                        await handleUploadInserts(onSuccess)
                    }} variant={'secondary'} className="w-full">Upload!</Button> : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

