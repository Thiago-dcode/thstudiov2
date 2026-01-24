import { useId, forwardRef } from "react"

import { cn } from "../../lib/utils"
import { useInputFile } from "../../contexts/file.provider"

type FileInputProps = Omit<React.ComponentProps<"input">, "type">


const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
    ({ className, onChange, ...props }, ref) => {
        const context = useInputFile();
        const fileInputId = useId()
        const inputId = props.id || fileInputId

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            // Update context if available
            if (context && files) {
                context.setFiles(files)
            }
            // Call the original onChange if provided
            if (onChange) {
                onChange(e)
            }
        }

        const fileCount = context?.files?.length || 0
        const fileName = fileCount === 1 ? context?.files?.[0]?.name || "" : ""

        return (
            <div className="relative w-full">
                <input
                     accept={context && context.allowedMimeTypes? context.allowedMimeTypes.join(','):undefined}
                    type="file"
                    id={inputId}
                    className="hidden"
                    ref={ref}
                    onChange={handleFileChange}
                    {...props}
                />
                <label
                    htmlFor={inputId}
                    className={cn(
                        "flex h-auto min-h-12 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-fg-2 bg-bg px-4 py-6 transition-colors hover:border-text/60 hover:bg-bg/80 focus-within:outline-none focus-within:border-text/80 label-file-input",
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
                        {fileName ? (
                            <>
                                <p className="text-sm font-medium text-text">{fileName}</p>
                                <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-text">
                                    Click to upload
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    or drag and drop
                                </p>
                            </>
                        )}
                    </div>
                </label>
            </div>
        )
    }
)

FileInput.displayName = "FileInput"

export { FileInput }

