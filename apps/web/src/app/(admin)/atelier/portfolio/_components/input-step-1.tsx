import { FileInputProvider, useInputFile } from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider"
import FormComponent from "@/lib/components/form-component";
import { useEffect, useRef, useState } from "react";
import { generateValidSlug, isAValidSlugFormat } from "@repo/common-lib/utils/generate-valid-slug";

const ThumbnailInput = () => {
    const { files } = useInputFile();

    const { formData, handleSetFormData, deleteInputErrorProperty, inputErrors, isPending,currentPortfolio } = usePortfolio();
    // Prioritize formData.thumbnail (persists across remounts) over files from context (resets on remount)
    const { previewUrls } = usePreviewUrls({ files: formData?.thumbnail || files || undefined });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            deleteInputErrorProperty('thumbnail');
            handleSetFormData('thumbnail', file);
        } 
    };


    return (
        <div className="space-y-4">
            {previewUrls?.length || currentPortfolio?.thumbnail ? (
                <div className="flex flex-col gap-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border">
                        <img
                            src={previewUrls[0] || currentPortfolio?.thumbnail}
                            alt="Thumbnail Preview"
                            className="w-full h-full object-cover opacity-80"
                        />
                        {formData?.title && (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <h3 className="text-3xl bg-black/50 p-2 px-4 font-bold text-white text-center drop-shadow-lg">
                                    {formData.title}
                                </h3>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground italic">
                    Add a thumbnail image for your portfolio (required)
                </p>
            )}
            <FileInput 
                name="thumbnail" 
                id="thumbnail-input" 
                required 
                onChange={(e) => {
                    handleFileChange(e)
                }}
                disabled={isPending}
            />
            {inputErrors?.thumbnail && (
                <p className="text-sm text-destructive">{inputErrors.thumbnail}</p>
            )}
        </div>
    );
};

 const FirstStepInputs = () => {
    const {
        formData,
        handleSetFormData,
        inputErrors,
        deleteInputErrorProperty,
        checkSlugAvailability,
        isCheckingSlugAvailability,
        isSlugAvailable,
        isPending
    } = usePortfolio();

    const manuallyChangedSlug = useRef(false);
    const previousSlugRef = useRef<string | undefined>(formData?.slug);

    const [isValidSlug, setIsValidSlug] = useState<boolean | undefined>(undefined)


    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        deleteInputErrorProperty('title');
        const newTitle = e.target.value;
        handleSetFormData('title', newTitle);

        // Only auto-generate slug if it's empty and wasn't manually changed
        if (!manuallyChangedSlug.current) {
            const generatedSlug = generateValidSlug(newTitle);
            if (generatedSlug && (isAValidSlugFormat(generatedSlug))) {
                handleSetFormData('slug', generatedSlug);
            }
            else if (!generatedSlug) {

                handleSetFormData('slug', '');
            }
        }
    };


    const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Preserve trailing hyphen while typing to allow users to type hyphens
        const newSlug = generateValidSlug(e.target.value, { preserveTrailingHyphen: true });

        deleteInputErrorProperty('slug');
        handleSetFormData('slug', newSlug);
        manuallyChangedSlug.current = !!newSlug;

    };

    useEffect(() => {
        const currentSlug = formData?.slug?.trim();
        const previousSlug = previousSlugRef.current?.trim();
        
        // Only check if slug actually changed (not on mount/navigation)
        const slugChanged = currentSlug !== previousSlug;
        
        if (currentSlug) {
            const isValid = isAValidSlugFormat(currentSlug);
            setIsValidSlug(isValid);
            
            // Only check availability if slug changed and is valid
            if (slugChanged && isValid && !currentSlug.endsWith('-')) {
                checkSlugAvailability();
            }
        } else {
            setIsValidSlug(undefined);
        }
        
        // Update the ref for next comparison
        previousSlugRef.current = formData?.slug;

    }, [formData?.slug, checkSlugAvailability])




    // Get slug status message
    const getSlugStatusMessage = () => {
        if (isCheckingSlugAvailability) {
            return <p className="text-sm text-muted-foreground">Checking availability...</p>;
        }
        if (typeof isSlugAvailable === 'boolean') {
            if (isSlugAvailable) {
                return <p className="text-sm text-green-600">✓ This slug is available</p>;
            } else {
                return <p className="text-sm text-destructive">✗ This slug is already taken</p>;
            }
        }
        return null;
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
            <div className="shrink-0 md:w-1/3 flex flex-col">
                <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                    <ThumbnailInput />
                </FileInputProvider>
            </div>

            <div className="flex-1 space-y-4 flex flex-col">
                <FormComponent.LabelInput
                    value={formData?.title || ''}
                    onChange={(e) => {
                        handleTitleChange(e)
                    }}
                    error={inputErrors?.title}
                    label="Title"
                    required
                    name="title"
                    id="title"
                    type="text"
                    placeholder="My Portfolio"
                    disabled={isPending}
                />

                <div className="space-y-2">
                <FormComponent.LabelInput
                    value={formData?.slug || ''}
                    onChange={(e) => {
                            handleSlugChange(e)
                    }}
                    error={inputErrors?.slug}
                    label="Slug"
                    required
                    name="slug"
                    id="slug"
                    type="text"
                    placeholder="my-portfolio"
                        extraInfo="A slug is a URL-friendly version of your title (e.g., 'my-awesome-portfolio'). It should be unique as it's used in the portfolio's URL to identify it and makes it easier to find."
                        disabled={isCheckingSlugAvailability || isPending}
                />
                    {isValidSlug === false && (
                        <p className="text-sm text-destructive">✗ Invalid slug format. Example: my-portfolio</p>
                    )}
                    {getSlugStatusMessage()}
                </div>

                <FormComponent.LabelTextarea
                    value={formData?.description || ''}
                    onChange={(e) => {
                        deleteInputErrorProperty('description');
                        handleSetFormData('description', e.target.value);
                    }}
                    error={inputErrors?.description}
                    rows={4}
                    label="Description"
                    name="description"
                    id="description"
                    placeholder="Describe your portfolio..."
                    disabled={isPending}
                />
            </div>
        </div>
    );
};

export default FirstStepInputs;