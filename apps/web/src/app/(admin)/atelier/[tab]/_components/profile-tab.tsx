'use client'

import Image from "next/image";
import fallbackBanner from '@/assets/images/fallback-banner.jpg'
import { Pen } from "lucide-react";
import { useTab } from "./tab.provider";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@repo/ui/components/shadcn/dialog";
import FormComponent from "@/lib/components/form-component";
import { FileInputProvider, useInputFile } from "@repo/ui/contexts/file.provider";
import { usePreviewUrl } from "@repo/ui/hooks/usePreviewUrl";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { Errors } from "@repo/ui/components/custom/errors";
import { useEffect, useState } from "react";

export default function ProfileTab() {
    const { user, handleSubmit, reset } = useTab();
    const [open, setOpen] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);

    const closeModal = () => {
        setOpen(false)
        reset()
    }
    const closeProfileModal = () => {
        setOpenProfile(false)
        reset()
    }
    return (
        <section className="w-full max-w-4xl   shadow-lg shadow-fg ">
            {/* Banner */}
            <div className="relative group h-48 aspect-video w-full">
                <Image
                    alt="banner"
                    src={fallbackBanner}
                    fill
                    className="object-cover rounded-t-md"
                />
                <button
                    type="button"
                    className="absolute top-3 right-3 p-2 bg-fg-1 hover:bg-fg-2 rounded-full  transition-opacity cursor-pointer "
                >
                    <Pen className="size-3" />
                </button>
                <div className="absolute top-32 left-6 w-32 h-32 rounded-full border-4 border-white bg-gray-200 ">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger className="absolute  right-1 p-2 bg-fg hover:bg-fg-2 rounded-full  transition-opacity cursor-pointer shadow-md ">
                            <Pen className="size-3" />
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogTitle>Edit Avatar</DialogTitle>
                            <FormComponent.Container >
                                <FormComponent.Form onSubmit={handleSubmit} className=" max-w-xl">
                                    <FileInputProvider allowedMimeTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}>
                                        <EditAvatar closeModal={() => {
                                            closeModal()
                                        }} defaultAvatar={user?.avatar} />

                                    </FileInputProvider>
                                </FormComponent.Form>

                            </FormComponent.Container>


                        </DialogContent>
                    </Dialog>
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.username || "User avatar"}
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                            {user.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}
                </div>

            </div>
            {/* Profile section */}
            <div className="relative px-6 py-4">
                <Dialog open={openProfile} onOpenChange={setOpenProfile}>
                    <DialogTrigger className="absolute top-3 right-3 p-2 bg-fg-1 hover:bg-fg-2 rounded-full transition-opacity cursor-pointer">
                        <Pen className="size-3" />
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogTitle>Edit Profile</DialogTitle>
                        <FormComponent.Container>
                            <FormComponent.Form onSubmit={handleSubmit} className="max-w-xl">
                                <EditProfile user={user} closeModal={closeProfileModal} />
                            </FormComponent.Form>
                        </FormComponent.Container>
                    </DialogContent>
                </Dialog>

                {/* User info */}
                <div className="pt-14 flex flex-col items-start justify-start gap-4">
                    <div className="flex flex-col items-start justify-start"> <h1 className="text-2xl font-bold">{user.name} {user.surname}</h1>
                        <p className="text-text-muted">{user.profession || 'Profession title'}</p></div>
                    <p>{user.short_biography}</p>
                </div>


            </div>
        </section>
    );
}
export const EditAvatar = ({ defaultAvatar, closeModal }: {
    defaultAvatar?: string,
    closeModal: () => void
}) => {
    const { errors, cleanErrors, isPending, success } = useTab();
    const { files } = useInputFile();

    useEffect(() => {
        if (success) closeModal();
    }, [success, closeModal]);
    const { previewUrl } = usePreviewUrl({ defaultUrl: defaultAvatar, files })

    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="flexw-full max-w-2xl mx-auto p-4">

                {previewUrl && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <h3 className="text-sm font-medium">Profile Preview:</h3>
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-fg-2">
                            <img
                                src={previewUrl}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}
            </div>
            <FileInput onChange={() => {
                cleanErrors()
            }} name="avatar" id="avatar-input" />

            <FormComponent.SubmitButton isPending={isPending} disabled={!files || !files.length || isPending}>Update</FormComponent.SubmitButton>

            {errors && errors.length > 0 ? (
                <Errors errors={errors} />
            ) : null}


        </div>

    )
}

export const EditProfile = ({ user, closeModal }: {
    user: { name?: string | null; surname?: string | null; profession?: string | null; short_biography?: string | null };
    closeModal: () => void;
}) => {
    const { errors, cleanErrors, isPending, success } = useTab();

    useEffect(() => {
        if (success) closeModal();
    }, [success, closeModal]);

    return (
        <div className="w-full flex flex-col gap-4">
            <FormComponent.LabelInput
                label="First Name"
                type="text"
                id="name"
                name="name"
                defaultValue={user?.name || undefined}
                placeholder="Leonardo"
                autoComplete="given-name"
                required
                autoFocus
                onChange={cleanErrors}
            />

            <FormComponent.LabelInput
                label="Last Name"
                type="text"
                id="surname"
                name="surname"
                defaultValue={user?.surname || undefined}
                placeholder="Piero da Vinci"
                autoComplete="family-name"
                required
                onChange={cleanErrors}
            />

            <FormComponent.LabelInput
                label="Profession"
                type="text"
                id="profession"
                name="profession"
                defaultValue={user?.profession || undefined}
                placeholder="Renaissance polymath & professional dreamer"
                autoComplete="organization-title"
                onChange={cleanErrors}
            />

            <FormComponent.LabelTextarea
                label="Short bio about you"
                id="short_biography"
                name="short_biography"
                defaultValue={user?.short_biography || undefined}
                placeholder="I sketch flying machines at breakfast and dissect curiosity for a living..."
                rows={4}
                onChange={cleanErrors}
            />

            <FormComponent.SubmitButton isPending={isPending} disabled={isPending}>
                Update
            </FormComponent.SubmitButton>

            {errors && errors.length > 0 ? (
                <Errors errors={errors} />
            ) : null}
        </div>
    );
}