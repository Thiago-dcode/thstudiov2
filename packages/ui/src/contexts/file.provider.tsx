import { useState, useContext, createContext, ReactElement } from "react"
import { MimeTypes } from '@repo/common-lib/types/general'
type FileContextProvider = {
    files?: FileList,
    errors?: string[],
    allowedMimeTypes?: MimeTypes[],
    setFiles: (file: FileList) => void
}


const FileContext = createContext<FileContextProvider>(
    {
        setFiles: () => { },
    }

)

export const useInputFile = () => useContext(FileContext);

export const FileInputProvider = ({ children, allowedMimeTypes }: {
    children: ReactElement,
    allowedMimeTypes?: MimeTypes[]
}) => {
    const [errors, setErrors] = useState<string[]>()
    const [files, _setFiles] = useState<FileList>()
    const setFiles = (files: FileList) => {
        const errors: string[] = []
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            if (!allowedMimeTypes?.includes(file.type as MimeTypes)) {

                errors.push(`Not allowed type for file: ${file.name}, allowed types: ${allowedMimeTypes?.join(', ')} `);
            }
        }
        setErrors(errors)
        if (!errors.length) _setFiles(files)
    }


    return (
        <FileContext.Provider value={{ files, allowedMimeTypes, errors, setFiles }}>
            {children}
        </FileContext.Provider>
    )

}

