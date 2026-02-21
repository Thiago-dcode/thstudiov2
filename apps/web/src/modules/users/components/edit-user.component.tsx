'use client'

import Image from "next/image";
import fallbackBanner from '@/assets/images/fallback-banner.jpg'
import { Pen } from "lucide-react";
import { useEditUser } from "../providers/edit-user.provider";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@repo/ui/components/shadcn/dialog";
import FormComponent from "@/lib/components/form-component";
import { FileInputProvider, useInputFile } from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { Errors } from "@repo/ui/components/custom/errors";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { UpdateCategoriesProvider, useUpdateCategories } from "@/modules/categories/providers/update-user-categories.provider";
import { UserCategoriesComponent } from "@/modules/categories/components/user-categories.component";
import { CreateOrUpdateAddress } from "@/modules/addresses/components/create-or-update-address";

export default function EditUserComponent() {
    const { user, address, setAddress, userCategories, handleSubmit, reset, success, isPending } = useEditUser();
    const [openAvatar, setOpenAvatar] = useState(false);
    const [openBanner, setOpenBanner] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [openCategories, setOpenCategories] = useState(false);
    const [openAddress, setOpenAddress] = useState(false);

    const handleSetOpen = (value: boolean, dialog: 'profile' | 'avatar' | 'banner' | 'categories' | 'address') => {
        if (!value && isPending) return;

        switch (dialog) {
            case 'avatar':
                setOpenAvatar(value);
                break;
            case 'banner':
                setOpenBanner(value);
                break;
            case 'profile':
                setOpenProfile(value);
                break;
            case 'categories':
                setOpenCategories(value);
                break;
            case 'address':
                setOpenAddress(value);
                break;
        }
    }
    const closeAllModals = () => {
        setOpenAvatar(false)
        setOpenBanner(false)
        setOpenProfile(false)
        setOpenCategories(false)
        setOpenAddress(false)
        reset()
    }

    useEffect(() => {
        if (success) closeAllModals();
    }, [success]);
    return (
        <section className="w-full  max-w-4xl shadow-lg shadow-fg pb-4 ">
            {/* Banner */}
            <div className="relative group max-h-74 aspect-video w-full">
                <Image
                    alt="banner"
                    src={user.banner || fallbackBanner}
                    fill
                    className="object-cover rounded-t-md"
                />
                <Dialog open={openBanner} onOpenChange={(value) => handleSetOpen(value, 'banner')}>
                    <DialogTrigger className="absolute top-3 right-3 p-2 bg-fg-1 hover:bg-fg-2 rounded-full transition-opacity cursor-pointer">
                        <Pen className="size-3" />
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogTitle>Edit Banner</DialogTitle>
                        <FormComponent.Container>
                            <FormComponent.Form onSubmit={handleSubmit} className="max-w-xl pt-4">
                                <FileInputProvider allowedMimeTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}>
                                    <EditBanner defaultBanner={user?.banner} />
                                </FileInputProvider>
                            </FormComponent.Form>
                        </FormComponent.Container>
                    </DialogContent>
                </Dialog>
                <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-white bg-gray-200 ">
                    <Dialog open={openAvatar} onOpenChange={(value) => handleSetOpen(value, 'avatar')}>
                        <DialogTrigger className="absolute  right-1 p-2 bg-fg hover:bg-fg-2 rounded-full  transition-opacity cursor-pointer shadow-md ">
                            <Pen className="size-3" />
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogTitle>Edit Avatar</DialogTitle>
                            <FormComponent.Container >
                                <FormComponent.Form onSubmit={handleSubmit} className=" max-w-xl pt-4">
                                    <FileInputProvider allowedMimeTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}>
                                        <EditAvatar defaultAvatar={user?.avatar} />
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
            <div className="relative pt-16 px-4">
                <Dialog open={openProfile} onOpenChange={(value) => handleSetOpen(value, 'profile')}>
                    <DialogTrigger className="absolute top-3 right-3 p-2 bg-fg-1 hover:bg-fg-2 rounded-full transition-opacity cursor-pointer">
                        <Pen className="size-3" />
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogTitle>Edit Profile</DialogTitle>
                        <FormComponent.Container>
                            <FormComponent.Form onSubmit={handleSubmit} className="max-w-xl pt-4">
                                <EditProfile user={user} />
                            </FormComponent.Form>
                        </FormComponent.Container>
                    </DialogContent>
                </Dialog>
                {/* User info */}
                <section className="py-2 flex  items-start justify-between">
                    <div className="flex flex-col items-start justify-start"> <h1 className="text-lg font-bold">{user.name} {user.surname}</h1>
                        <p className=" text-text-muted">{user.profession || 'Profession title'}</p>
                        <p className="pt-2">{user.short_biography}</p>
                    </div>

                </section>
                <section className="flex items-center justify-start gap-2">
                    <p>{address?.formated_address || 'No address set'}</p>
                    <Dialog open={openAddress} onOpenChange={(value) => handleSetOpen(value, 'address')}>
                        <DialogTrigger className="p-2 bg-fg-1 hover:bg-fg-2 rounded-full transition-opacity cursor-pointer">
                            <Pen className="size-2" />
                        </DialogTrigger>
                        <DialogContent className="w-fit">
                            <DialogTitle>Edit Address</DialogTitle>
                            <DialogDescription>
                                {address
                                    ? "Warning: Updating your address could affect your discovery and visibility in search results. Only update it if you really need it"
                                    : "Update your address information below."
                                }
                            </DialogDescription>
                            <CreateOrUpdateAddress
                                userId={user.id}
                                defaultAddress={address}
                                onSuccess={(address) => {
                                    setAddress(address);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </section>
                {/*Categories section */}
                <section className="flex flex-col items-start justify-start gap-1 pt-8">
                    <div className="flex items-center justify-start gap-2">
                        <h3 className="text-text-muted">Categories</h3>
                        <Dialog open={openCategories} onOpenChange={(value) => handleSetOpen(value, 'categories')}>
                            <DialogTrigger className="p-2 bg-fg-1 hover:bg-fg-2 rounded-full transition-opacity cursor-pointer">
                                <Pen className="size-2" />
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogTitle>Edit Categories</DialogTitle>
                                <UpdateCategoriesProvider userCategories={userCategories}>
                                    <FormComponent.Container>
                                        <FormComponent.Form onSubmit={handleSubmit} className="max-w-xl pt-4">
                                            <EditCategories />
                                        </FormComponent.Form>
                                    </FormComponent.Container>
                                </UpdateCategoriesProvider>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex w-full flex-wrap gap-1">
                        {userCategories.map(category => {

                            return <Badge key={`user-category-${category.id}`}>{category.translation?.name || category.name}</Badge>
                        })}
                    </div>
                </section>
            </div>
        </section>
    );
}
export const EditAvatar = ({ defaultAvatar }: {
    defaultAvatar?: string
}) => {
    const { errors, inputErrors, deleteInputErrorProperty, isPending } = useEditUser();
    const { files } = useInputFile();
    const { previewUrls } = usePreviewUrls({ defaultUrl: defaultAvatar, files })

    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="flexw-full max-w-2xl mx-auto p-4">

                {previewUrls?.length && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <h3 className="text-sm font-medium">Profile Preview:</h3>
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-fg-2">
                            <img
                                src={previewUrls[0]}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}
            </div>
            <FileInput
                onChange={() => deleteInputErrorProperty('avatar')}
                name="avatar"
                id="avatar-input"
                error={inputErrors?.avatar}
            />

            <FormComponent.SubmitButton isPending={isPending} disabled={!files || !files.length || isPending}>Update</FormComponent.SubmitButton>

            {errors && errors.length > 0 ? (
                <Errors errors={errors} />
            ) : null}
        </div>

    )
}

export const EditBanner = ({ defaultBanner }: {
    defaultBanner?: string
}) => {
    const { errors, inputErrors, deleteInputErrorProperty, isPending } = useEditUser();
    const { files } = useInputFile();
    const { previewUrls } = usePreviewUrls({ defaultUrl: defaultBanner, files })

    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full max-w-2xl mx-auto p-4">
                {previewUrls?.length ? (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <h3 className="text-sm font-medium">Banner Preview:</h3>
                        <div className="relative w-full aspect-video overflow-hidden rounded-md border-4 border-fg-2">
                            <img
                                src={previewUrls[0]}
                                alt="Banner Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                ) : null}
            </div>
            <FileInput
                onChange={() => deleteInputErrorProperty('banner')}
                name="banner"
                id="banner-input"
                error={inputErrors?.banner}
            />

            <FormComponent.SubmitButton isPending={isPending} disabled={!files || !files.length || isPending}>Update</FormComponent.SubmitButton>

            {errors && errors.length > 0 ? (
                <Errors errors={errors} />
            ) : null}
        </div>
    )
}

export const EditProfile = ({ user }: {
    user: { name?: string | null; surname?: string | null; profession?: string | null; short_biography?: string | null };
}) => {
    const { errors, inputErrors, deleteInputErrorProperty, isPending } = useEditUser();

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
                error={inputErrors?.name}
                onChange={() => deleteInputErrorProperty('name')}
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
                error={inputErrors?.surname}
                onChange={() => deleteInputErrorProperty('surname')}
            />

            <FormComponent.LabelInput
                label="Profession"
                type="text"
                id="profession"
                name="profession"
                defaultValue={user?.profession || undefined}
                placeholder="Renaissance polymath & professional dreamer"
                autoComplete="organization-title"
                error={inputErrors?.profession}
                onChange={() => deleteInputErrorProperty('profession')}
            />

            <FormComponent.LabelTextarea
                label="Short bio about you"
                id="short_biography"
                name="short_biography"
                defaultValue={user?.short_biography || undefined}
                placeholder="I sketch flying machines at breakfast and dissect curiosity for a living..."
                rows={4}
                error={inputErrors?.short_biography}
                onChange={() => deleteInputErrorProperty('short_biography')}
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

export const EditCategories = () => {
    const { errors, isPending } = useEditUser();
    const { categoriesSelected } = useUpdateCategories();
    const inputCategoryIds = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputCategoryIds.current) {
            inputCategoryIds.current.value = '';
            if (categoriesSelected.length > 0) {
                inputCategoryIds.current.value = categoriesSelected.reduce((acc, curr, idx) => {
                    let str = acc + `${curr.id}`;
                    if (idx !== categoriesSelected.length - 1) str += ',';
                    return str;
                }, '');
            }
        }
    }, [categoriesSelected]);

    return (
        <div className="w-full flex flex-col gap-4">
            <UserCategoriesComponent />
            <input ref={inputCategoryIds} type="text" name="categories" hidden />
            <FormComponent.SubmitButton className="sticky bottom-0" isPending={isPending} disabled={categoriesSelected.length === 0 || categoriesSelected.length > 10 || isPending}>
                Update
            </FormComponent.SubmitButton>

            {errors && errors.length > 0 ? (
                <Errors errors={errors} />
            ) : null}
        </div>
    );
}
