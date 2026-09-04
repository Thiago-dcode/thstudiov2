'use client'

import { useState, useContext, createContext, ReactElement, useMemo, useCallback } from "react"
import { MimeTypes } from '@repo/common-lib/types/general'

/**
 * Structured rather than a ready-made sentence: this package has no i18n, so consumers
 * translate the code themselves (`validation.file.invalidType` / `validation.file.tooLarge`).
 */
export type FileValidationError = {
    code: 'invalid_type' | 'too_large',
    fileName: string,
    /**
     * The cap this file was measured against, for `too_large`. Carried on the error because
     * the limit can differ per file (video vs image), so the consumer cannot recover it from
     * a single provider-level number when it renders the message.
     */
    limitBytes?: number
}

/** Per-file byte cap, for consumers whose limit depends on what the file is. */
export type MaxFileSizeResolver = (file: File) => number

type FileContextProvider = {
    files?: FileList,
    errors?: FileValidationError[],
    allowedMimeTypes?: MimeTypes[],
    maxFileSizeBytes?: number,
    maxFileSizeBytesFor?: MaxFileSizeResolver,
    setFiles: (file: FileList) => void
}


const FileContext = createContext<FileContextProvider>(
    {
        setFiles: () => { },
    }

)

export const useInputFile = () => useContext(FileContext);

export const FileInputProvider = ({ children, allowedMimeTypes, maxFileSizeBytes, maxFileSizeBytesFor }: {
    children: ReactElement,
    allowedMimeTypes?: MimeTypes[],
    /** Rejects anything larger, so oversize files fail at selection instead of after upload. */
    maxFileSizeBytes?: number,
    /**
     * Takes precedence over {@link maxFileSizeBytes} when the cap depends on the file itself.
     * Media uploads need it: a video is allowed to be twelve times an image's size, and one
     * flat number would either reject legitimate video or wave through an enormous PNG.
     */
    maxFileSizeBytesFor?: MaxFileSizeResolver
}) => {
    const [errors, setErrors] = useState<FileValidationError[]>()
    const [files, _setFiles] = useState<FileList>()
    const setFiles = useCallback((files: FileList) => {
        const errors: FileValidationError[] = []
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            if (!allowedMimeTypes?.includes(file.type as MimeTypes)) {
                errors.push({ code: 'invalid_type', fileName: file.name });
                continue;
            }
            const limit = maxFileSizeBytesFor?.(file) ?? maxFileSizeBytes;
            if (typeof limit === 'number' && file.size > limit) {
                errors.push({ code: 'too_large', fileName: file.name, limitBytes: limit });
            }
        }
        setErrors(errors)
        if (!errors.length) _setFiles(files)
    }, [allowedMimeTypes, maxFileSizeBytes, maxFileSizeBytesFor])

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        files,
        allowedMimeTypes,
        maxFileSizeBytes,
        maxFileSizeBytesFor,
        errors,
        setFiles
    }), [files, allowedMimeTypes, maxFileSizeBytes, maxFileSizeBytesFor, errors, setFiles])


    return (
        <FileContext.Provider value={value}>
            {children}
        </FileContext.Provider>
    )

}

