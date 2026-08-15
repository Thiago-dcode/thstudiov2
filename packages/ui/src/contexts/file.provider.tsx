'use client'

import { useState, useContext, createContext, ReactElement, useMemo, useCallback } from "react"
import { MimeTypes } from '@repo/common-lib/types/general'

/**
 * Structured rather than a ready-made sentence: this package has no i18n, so consumers
 * translate the code themselves (`validation.file.invalidType` / `validation.file.tooLarge`).
 */
export type FileValidationError = {
    code: 'invalid_type' | 'too_large',
    fileName: string
}

type FileContextProvider = {
    files?: FileList,
    errors?: FileValidationError[],
    allowedMimeTypes?: MimeTypes[],
    maxFileSizeBytes?: number,
    setFiles: (file: FileList) => void
}


const FileContext = createContext<FileContextProvider>(
    {
        setFiles: () => { },
    }

)

export const useInputFile = () => useContext(FileContext);

export const FileInputProvider = ({ children, allowedMimeTypes, maxFileSizeBytes }: {
    children: ReactElement,
    allowedMimeTypes?: MimeTypes[],
    /** Rejects anything larger, so oversize files fail at selection instead of after upload. */
    maxFileSizeBytes?: number
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
            if (typeof maxFileSizeBytes === 'number' && file.size > maxFileSizeBytes) {
                errors.push({ code: 'too_large', fileName: file.name });
            }
        }
        setErrors(errors)
        if (!errors.length) _setFiles(files)
    }, [allowedMimeTypes, maxFileSizeBytes])

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        files,
        allowedMimeTypes,
        maxFileSizeBytes,
        errors,
        setFiles
    }), [files, allowedMimeTypes, maxFileSizeBytes, errors, setFiles])


    return (
        <FileContext.Provider value={value}>
            {children}
        </FileContext.Provider>
    )

}

