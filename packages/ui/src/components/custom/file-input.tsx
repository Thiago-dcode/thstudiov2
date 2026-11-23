import { useId, forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type DragEvent } from "react"

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
    /** Replaces {@link labelContent} while files are dragged over the zone ("Drop to add"). */
    dragLabelContent?: ReactNode;
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

/** True when a drag carries files (not text or a link dragged from the page). */
const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files")

/**
 * Hands dropped files to a file input exactly as if the user had picked them: they are written
 * into `input.files` and a bubbling `change` event is fired, so the input's own `onChange` path
 * runs unchanged — truncation to the remaining slots, provider validation, and native `FormData`
 * submission for single-file forms. A single-file input only takes the first file. Returns false
 * when the browser cannot do it (no `DataTransfer` constructor) or the input is disabled.
 */
export const dropFilesIntoInput = (input: HTMLInputElement | null, files: FileList | null | undefined) => {
    if (!input || input.disabled || !files?.length || typeof DataTransfer === "undefined") return false
    let list = files
    // The picker honours `accept`; a drop does not. A single-file form submits `input.files`
    // natively, so a dropped PDF would replace a good pick and be posted. Skip what the picker
    // would not have offered. Multi-file inputs keep everything: their provider names each
    // rejected file, which beats it silently not appearing.
    if (!input.multiple && input.accept) {
        const accepted = input.accept.split(",").map((type) => type.trim().toLowerCase()).filter(Boolean)
        const matches = (file: File) => accepted.some((type) =>
            type.startsWith(".") ? file.name.toLowerCase().endsWith(type)
                : type.endsWith("/*") ? file.type.startsWith(type.slice(0, -1))
                    : file.type === type)
        const first = Array.from(files).find(matches)
        if (!first) return false
        const only = new DataTransfer()
        only.items.add(first)
        list = only.files
    }
    input.files = detachFiles(list, input.multiple ? undefined : 1)
    input.dispatchEvent(new Event("change", { bubbles: true }))
    return true
}

/**
 * Calls `reset` whenever a drag ends anywhere on the page (dropped elsewhere, cancelled with Esc,
 * dragged out of the window). Drag counters rely on matching enter/leave pairs, and the browser
 * does not always deliver the leave; this is the backstop that keeps a highlight from sticking.
 */
export const useDragEndReset = (reset: () => void) => {
    const resetRef = useRef(reset)
    useEffect(() => {
        resetRef.current = reset
    })
    useEffect(() => {
        const handler = () => resetRef.current()
        window.addEventListener("dragend", handler)
        window.addEventListener("drop", handler)
        return () => {
            window.removeEventListener("dragend", handler)
            window.removeEventListener("drop", handler)
        }
    }, [])
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
    ({ className, onChange, error, currentFiles, maxFiles, disabled, labelContent, dragLabelContent, ...props }, ref) => {
        const context = useInputFile();
        const fileInputId = useId()
        const inputId = props.id || fileInputId
        const inputRef = useRef<HTMLInputElement>(null)
        useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)
        // Counts nested dragenter/dragleave pairs: moving over the icon or text inside the label
        // fires a leave on the label, which would otherwise flicker the highlight off.
        const dragDepth = useRef(0)
        const [isDragging, setIsDragging] = useState(false)
        const hasMaxFiles = typeof maxFiles === "number" && maxFiles >= 0
        const existingFilesCount = typeof currentFiles === "number" ? currentFiles : 0
        const isLimitReached = hasMaxFiles && existingFilesCount >= maxFiles
        const isDisabled = Boolean(disabled || isLimitReached)

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
            // removed did nothing at all and read as a broken input. Only for append-style inputs
            // (`maxFiles`), which read the selection from the context: single-file forms submit through
            // native `FormData`, so resetting there sent an empty file. Skipped when the selection could
            // not be copied, because the reset would empty the list already handed to the context.
            if (hasMaxFiles && canDetach) {
                e.target.value = ""
            }
        }

        const resetDrag = () => {
            dragDepth.current = 0
            setIsDragging(false)
        }
        useDragEndReset(resetDrag)

        const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
            if (!isFileDrag(e)) return
            e.preventDefault()
            dragDepth.current += 1
            if (!isDisabled) setIsDragging(true)
        }

        const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
            if (!isFileDrag(e)) return
            // Required for the drop to be allowed at all; without it the browser opens the file.
            e.preventDefault()
            e.dataTransfer.dropEffect = isDisabled ? "none" : "copy"
        }

        const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
            if (!isFileDrag(e)) return
            dragDepth.current = Math.max(0, dragDepth.current - 1)
            if (dragDepth.current === 0) setIsDragging(false)
        }

        const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
            if (!isFileDrag(e)) return
            // Marks the drop as handled. It still bubbles, so a surrounding drop area (the upload
            // dialog's pane) can clear its own highlight; it must check `isDefaultPrevented()` and
            // not add the files a second time.
            e.preventDefault()
            resetDrag()
            if (isDisabled) return
            dropFilesIntoInput(inputRef.current, e.dataTransfer.files)
        }

        const fileCount = context?.files?.length || 0
        const fileName = fileCount === 1 ? context?.files?.[0]?.name || "" : ""

        return (
            <div className="relative w-full flex flex-col gap-1">
                {/* Visually hidden, not `display:none`: it stays in the tab order, so keyboard users
                    can reach it (Enter/Space opens the picker) and the label shows the focus ring. */}
                <input
                    accept={context && context.allowedMimeTypes ? context.allowedMimeTypes.join(',') : undefined}
                    type="file"
                    id={inputId}
                    className="peer sr-only"
                    ref={inputRef}
                    onChange={handleFileChange}
                    disabled={isDisabled}
                    {...props}
                />
                <label
                    htmlFor={inputId}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    data-dragging={isDragging || undefined}
                    className={cn(
                        "flex h-auto min-h-12 w-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-fg-2 bg-bg px-4 py-6 transition-colors hover:border-text/60 hover:bg-bg/80 label-file-input",
                        "peer-focus-visible:border-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-text",
                        isDragging && "border-text bg-fg-1",
                        // No pointer events when disabled: no misleading hover, and a drop falls
                        // through to any surrounding drop area (which can say why it is full).
                        isDisabled && "pointer-events-none cursor-not-allowed opacity-60",
                        // Children never receive pointer or drag events, so enter/leave only ever
                        // fire on the label itself and the drag counter cannot lose a `dragleave`
                        // to a child that changed under the pointer.
                        "[&_*]:pointer-events-none",
                        error && "border-error",
                        className
                    )}
                >
                    <svg
                        aria-hidden="true"
                        className={cn("h-10 w-10 text-fg-2 transition-transform", isDragging && "-translate-y-1 text-text")}
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
                    {/* Both variants stay mounted and swap by CSS, so nothing under the pointer is
                        removed mid-drag. */}
                    {dragLabelContent ? (
                        <div className={cn("text-center", !isDragging && "hidden")}>{dragLabelContent}</div>
                    ) : null}
                    <div className={cn("text-center", isDragging && dragLabelContent && "hidden")}>
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
