import { useId, forwardRef, type ReactNode } from "react"

import { cn } from "../../lib/utils"
import { useInputFile } from "../../contexts/file.provider"

type FileInputProps = Omit<React.ComponentProps<"input">, "type"> & {
    error?: string;
    currentFiles?: number;
    maxFiles?: number;
    /**
     * Replaces the copy inside the dropzone. The default only knows about picking a single file,
     * which reads wrong wherever the input appends to an existing selection — those consumers pass
     * their own (translated) wording here.
     */
    labelContent?: ReactNode;
}

/**
 * Copies a selection into a `FileList` that belongs to no input, optionally keeping only the first
 * `limit` files. The list handed out by `e.target.files` is *live*: resetting the input's value
 * empties that very object in Chromium and WebKit, while Firefox swaps in a fresh one — so a
 * reference kept across the reset reads as zero files everywhere but Firefox.
 */
const detachFiles = (list: FileList, limit?: number) => {
    const dataTransfer = new DataTransfer()
    const count = typeof limit === "number" ? Math.min(limit, list.length) : list.length
    for (let index = 0; index < count; index++) {
        const file = list.item(index)
        if (file) dataTransfer.items.add(file)
    }

    return dataTransfer.files
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
    ({ className, onChange, error, currentFiles, maxFiles, disabled, labelContent, ...props }, ref) => {
        const context = useInputFile();
        const fileInputId = useId()
        const inputId = props.id || fileInputId
        const hasMaxFiles = typeof maxFiles === "number" && maxFiles >= 0
        const existingFilesCount = typeof currentFiles === "number" ? currentFiles : 0
        const isLimitReached = hasMaxFiles && existingFilesCount >= maxFiles

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files
            // Undefined in JSDOM and other non-browser hosts; without it the selection cannot be
            // copied, so it must neither be truncated nor survive the reset below.
            const canDetach = typeof DataTransfer !== "undefined"
            let limit: number | undefined

            if (hasMaxFiles && selected) {
                const remainingSlots = maxFiles - existingFilesCount
                if (remainingSlots <= 0) {
                    e.target.value = ""
                    return
                }

                if (selected.length > remainingSlots) {
                    if (!canDetach) {
                        e.target.value = ""
                        return
                    }

                    limit = remainingSlots
                }
            }

            // Only what fits reaches the context, and as a list of its own — see `detachFiles`.
            if (context && selected) {
                context.setFiles(canDetach ? detachFiles(selected, limit) : selected)
            }

            // Called while `e.target.files` still holds the *full* selection, so a consumer can compare it
            // against its own remaining-slot count and say what was left out. This used to overwrite
            // `e.target.files` with the truncated list first, which made every such check unreachable.
            if (onChange) {
                onChange(e)
            }

            // Last. An unchanged `value` fires no `change` event, so re-picking a file the user had just
            // removed did nothing at all and read as a broken input. Skipped when the selection could not
            // be copied, because the reset would empty the list already handed to the context.
            if (canDetach) {
                e.target.value = ""
            }
        }

        const fileCount = context?.files?.length || 0
        const fileName = fileCount === 1 ? context?.files?.[0]?.name || "" : ""

        return (
            <div className="relative w-full flex flex-col gap-1">
                <input
                    accept={context && context.allowedMimeTypes ? context.allowedMimeTypes.join(',') : undefined}
                    type="file"
                    id={inputId}
                    className="hidden"
                    ref={ref}
                    onChange={handleFileChange}
                    disabled={disabled || isLimitReached}
                    {...props}
                />
                <label
                    htmlFor={inputId}
                    className={cn(
                        "flex h-auto min-h-12 w-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-fg-2 bg-bg px-4 py-6 transition-colors hover:border-text/60 hover:bg-bg/80 focus-within:outline-none focus-within:border-text/80 label-file-input",
                        (disabled || isLimitReached) && "cursor-not-allowed opacity-60 pointer-events-none",
                        error && "border-error",
                        className
                    )}
                >
                    <svg
                        className="h-10 w-10 text-fg-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                    </svg>
                    <div className="text-center">
                        {labelContent ?? (fileName ? (
                            <>
                                <p className="text-sm font-medium text-text">{fileName}</p>
                                <p className="text-xs text-text-muted mt-1">Click to change file</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-text">
                                    Click to upload
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    or drag and drop
                                </p>
                            </>
                        ))}
                    </div>
                </label>
                {error && (
                    <p className="text-xs text-error">{error}</p>
                )}
            </div>
        )
    }
)

FileInput.displayName = "FileInput"

export { FileInput }
