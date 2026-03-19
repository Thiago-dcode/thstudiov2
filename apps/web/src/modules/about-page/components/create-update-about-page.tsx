'use client'

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { createAboutPageAction, updateAboutPageAction } from "../server-actions/create-update-about-page.action"
import FormComponent from "@/lib/components/form-component"
import { FileInputProvider, useInputFile } from "@repo/ui/contexts/file.provider"
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls"
import { AboutPage } from "@repo/common-lib/types/about-page"
import { FileInput } from "@repo/ui/components/custom/file-input"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@repo/ui/components/shadcn/dialog"
import { Button } from "@repo/ui/components/shadcn/button"
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants"
import { cn } from "@repo/ui/lib/utils"
import { useState } from "react"
import { Plus, Pencil } from "lucide-react"

export const CreateOrUpdateAboutPage = ({ currentAboutPage, userId }: {
    currentAboutPage?: AboutPage,
    userId: number
}) => {
    const [open, setOpen] = useState(false);
    const { handleSubmit, isPending, success, deleteInputErrorProperty, inputErrors, reset, cleanErrors } = useHandleAction({
        action: async (formData) => {

            if (!currentAboutPage) {
                formData.set('user_id', userId + '')
                return await createAboutPageAction(formData)
            }
            return await updateAboutPageAction(currentAboutPage.id, formData)
        },
        afterAction: async (result) => {
            if (result.data) {
                setOpen(false)
            }

        },
        beforeAction: async () => {
            reset()
        }
    });
    return <Dialog open={open} onOpenChange={(e) => {
            if (isPending) return;
            if (!e) cleanErrors();
            setOpen(e)
        }}>
            <DialogTrigger asChild>
                <Button variant="primary" size="sm">
                    {!currentAboutPage ? (
                        <><Plus className="size-4" /> Create About Page</>
                    ) : (
                        <><Pencil className="size-4" /> Edit About Page</>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-5/6 overflow-auto">
                <DialogTitle>{!currentAboutPage ? "Create About Page" : "Update About Page"}</DialogTitle>
                <FormComponent.Container className="">
                    <FormComponent.Form onSubmit={handleSubmit}>
                        <div className="space-y-1">
                            <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                                <PhotoInput defaultUrl={currentAboutPage?.photo || undefined} />
                            </FileInputProvider>
                        </div>
                        <FormComponent.LabelInput
                            onChange={() => deleteInputErrorProperty('title')}
                            error={inputErrors?.title}
                            defaultValue={currentAboutPage?.title || undefined}
                            label="Title"
                            required={!currentAboutPage}
                            name="title"
                            id="title"
                            type="text"
                            placeholder="The story behind the canvas"
                        />
                        <FormComponent.LabelTextarea
                            onChange={() => deleteInputErrorProperty('description')}
                            error={inputErrors?.description}
                            rows={8}
                            defaultValue={currentAboutPage?.description || undefined}
                            label="Description"
                            required={!currentAboutPage}
                            name="description"
                            id="description"
                            placeholder="Share your journey as an artist. What inspires you? What drives your creative vision? Let visitors connect with the person behind the art..."
                        />

                        <div className="sticky bottom-0 bg-fg p-2">
                            <FormComponent.SubmitButton isPending={isPending} success={success}>{!currentAboutPage ? "Create" : "Update"}</FormComponent.SubmitButton>
                        </div>
                    </FormComponent.Form>
                </FormComponent.Container>

            </DialogContent>
        </Dialog>
}

const PhotoInput = ({ defaultUrl }: {
    defaultUrl?: string
}) => {
    const { files } = useInputFile();
    const { previewUrls } = usePreviewUrls({
        defaultUrl,
        files
    });

    return <div className={cn("w-full mx-auto p-4 flex items-center gap-4", {
        'flex-col': !previewUrls?.length
    })}>
        <div>
            {previewUrls?.length ? (
                <div className="mt-4 flex flex-col items-center gap-2">
                    <h3 className="text-sm font-medium">Photo Preview:</h3>
                    <div className="relative aspect-3/4 max-h-[500px] max-w-[300px] overflow-hidden rounded-md border-4 border-fg-2">
                        <img
                            src={previewUrls[0]}
                            alt="Photo Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            ) : (
                <p className="text-sm text-text-muted italic">Choose a photo (preferably of yourself) to display on your about page.</p>
            )}
        </div>
        <FileInput name="photo" id="photo-input" />
    </div>


}