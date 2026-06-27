"use client";

import { Errors } from "@repo/ui/components/custom/errors";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import {
  FileInputProvider,
  useInputFile,
} from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { Pen } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import FormComponent from "@/lib/components/form-component";
import { CreateOrUpdateAddress } from "@/modules/addresses/components/create-or-update-address";
import { UserCategoriesComponent } from "@/modules/categories/components/user-categories.component";
import {
  UpdateCategoriesProvider,
  useUpdateCategories,
} from "@/modules/categories/providers/categories.provider";
import { useEditUser } from "../providers/edit-user.provider";

export default function EditUserComponent() {
  const t = useTranslations("editUser");
  const {
    user,
    address,
    setAddress,
    userCategories,
    handleSubmit,
    reset,
    success,
    isPending,
  } = useEditUser();
  const [openAvatar, setOpenAvatar] = useState(false);
  const [openBanner, setOpenBanner] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openCategories, setOpenCategories] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSetOpen = (
    value: boolean,
    dialog: "profile" | "avatar" | "banner" | "categories" | "address",
  ) => {
    if (!value && isPending) return;

    switch (dialog) {
      case "avatar":
        setOpenAvatar(value);
        break;
      case "banner":
        setOpenBanner(value);
        break;
      case "profile":
        setOpenProfile(value);
        break;
      case "categories":
        setOpenCategories(value);
        break;
      case "address":
        setOpenAddress(value);
        break;
    }
  };
  const closeAllModals = () => {
    setOpenAvatar(false);
    setOpenBanner(false);
    setOpenProfile(false);
    setOpenCategories(false);
    setOpenAddress(false);
    reset();
  };

  useEffect(() => {
    if (success) closeAllModals();
  }, [success, closeAllModals]);

  if (!isMounted) {
    return <div className="w-full max-w-4xl h-96 animate-pulse bg-fg" />;
  }

  return (
    <section className="w-full max-w-4xl shadow-lg shadow-fg pb-4 ">
      {/* Banner */}
      <div className="relative group max-h-74 aspect-video w-full">
        <Image
          alt={t("banner.alt")}
          src={user.banner || fallbackBanner}
          fill
          className="object-cover"
        />
        <Dialog
          open={openBanner}
          onOpenChange={(value) => handleSetOpen(value, "banner")}
        >
          <DialogTrigger className="absolute top-3 right-3 p-2 bg-fg hover:bg-fg-2 transition-opacity cursor-pointer">
            <Pen className="size-3" />
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogTitle>{t("banner.editTitle")}</DialogTitle>
            <FormComponent.Container>
              <FormComponent.Form
                onSubmit={handleSubmit}
                className="max-w-xl pt-4"
              >
                <FileInputProvider
                  allowedMimeTypes={[
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/webp",
                  ]}
                >
                  <EditBanner defaultBanner={user?.banner} />
                </FileInputProvider>
              </FormComponent.Form>
            </FormComponent.Container>
          </DialogContent>
        </Dialog>
        <div className="absolute -bottom-16 left-6 w-32 h-32 border-4 border-white bg-gray-200  rounded-full">
          <Dialog
            open={openAvatar}
            onOpenChange={(value) => handleSetOpen(value, "avatar")}
          >
            <DialogTrigger className="absolute right-1 p-2 bg-fg hover:bg-fg-2 transition-opacity cursor-pointer shadow-md ">
              <Pen className="size-3" />
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogTitle>{t("avatar.editTitle")}</DialogTitle>
              <FormComponent.Container>
                <FormComponent.Form
                  onSubmit={handleSubmit}
                  className=" max-w-xl pt-4"
                >
                  <FileInputProvider
                    allowedMimeTypes={[
                      "image/jpeg",
                      "image/jpg",
                      "image/png",
                      "image/webp",
                    ]}
                  >
                    <EditAvatar defaultAvatar={user?.avatar} />
                  </FileInputProvider>
                </FormComponent.Form>
              </FormComponent.Container>
            </DialogContent>
          </Dialog>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username || t("avatar.alt")}
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
        <Dialog
          open={openProfile}
          onOpenChange={(value) => handleSetOpen(value, "profile")}
        >
          <DialogTrigger className="absolute top-3 right-3 p-2 bg-fg hover:bg-fg-2 transition-opacity cursor-pointer">
            <Pen className="size-3" />
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogTitle>{t("profile.editTitle")}</DialogTitle>
            <FormComponent.Container>
              <FormComponent.Form
                onSubmit={handleSubmit}
                className="max-w-xl pt-4"
              >
                <EditProfile user={user} />
              </FormComponent.Form>
            </FormComponent.Container>
          </DialogContent>
        </Dialog>
        {/* User info */}
        <section className="py-2 flex items-start justify-between">
          <div className="flex flex-col items-start justify-start">
            {" "}
            <h1 className="text-lg font-bold">
              {user.name} {user.surname}
            </h1>
            <p className=" text-text-muted">
              {user.profession || t("profile.professionFallback")}
            </p>
            <p className="pt-2">
              {user.short_biography || t("profile.biographyFallback")}
            </p>
          </div>
        </section>
        <section className="flex items-start justify-start gap-2 min-w-0">
          <p className=" wrap-break-word text-text-muted">
            {address?.formated_address || t("address.noAddress")}
          </p>
          <Dialog
            open={openAddress}
            onOpenChange={(value) => handleSetOpen(value, "address")}
          >
            <DialogTrigger className="shrink-0 flex items-center bg-fg p-2 transition-opacity hover:bg-fg-2 cursor-pointer">
              <Pen className="size-3" aria-hidden />
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl"
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <DialogTitle>{t("address.editTitle")}</DialogTitle>
              <DialogDescription className="text-pretty">
                {address
                  ? t("address.warningDescription")
                  : t("address.updateDescription")}
              </DialogDescription>
              <FormComponent.Container>
                <div className="max-w-xl pt-4 w-full min-w-0">
                  {openAddress ? (
                    <CreateOrUpdateAddress
                      userId={user.id}
                      defaultAddress={address}
                      onSuccess={(address) => {
                        setAddress(address);
                      }}
                    />
                  ) : null}
                </div>
              </FormComponent.Container>
            </DialogContent>
          </Dialog>
        </section>
        {/*Categories section */}
        <section className="flex flex-col items-start justify-start gap-1 pt-8">
          <div className="flex items-center justify-start gap-2">
            <h3 className="text-text-muted">{t("categories.title")}</h3>
            <Dialog
              open={openCategories}
              onOpenChange={(value) => handleSetOpen(value, "categories")}
            >
              <DialogTrigger className="p-2 bg-fg hover:bg-fg-2 transition-opacity cursor-pointer">
                <Pen className="size-3" />
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogTitle>{t("categories.editTitle")}</DialogTitle>
                <UpdateCategoriesProvider userCategories={userCategories}>
                  <FormComponent.Container>
                    <FormComponent.Form
                      onSubmit={handleSubmit}
                      className="max-w-xl pt-4"
                    >
                      <EditCategories />
                    </FormComponent.Form>
                  </FormComponent.Container>
                </UpdateCategoriesProvider>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex w-full flex-wrap gap-1">
            {userCategories.map((category) => {
              return (
                <Badge key={`user-category-${category.id}`}>
                  {category.name}
                </Badge>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
export const EditAvatar = ({ defaultAvatar }: { defaultAvatar?: string }) => {
  const t = useTranslations("editUser");
  const { errors, inputErrors, deleteInputErrorProperty, isPending } =
    useEditUser();
  const { files } = useInputFile();
  const { previewUrls } = usePreviewUrls({ defaultUrl: defaultAvatar, files });

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flexw-full max-w-2xl mx-auto p-4">
        {previewUrls?.length && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <h3 className="text-sm font-medium">{t("avatar.preview")}</h3>
            <div className="relative w-32 h-32 overflow-hidden border-4 rounded-full">
              <img
                src={previewUrls[0]}
                alt={t("avatar.previewAlt")}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
      <FileInput
        onChange={() => deleteInputErrorProperty("avatar")}
        name="avatar"
        id="avatar-input"
        error={inputErrors?.avatar}
      />

      <FormComponent.SubmitButton
        isPending={isPending}
        disabled={!files?.length || isPending}
      >
        {t("update")}
      </FormComponent.SubmitButton>

      {errors && errors.length > 0 ? <Errors errors={errors} /> : null}
    </div>
  );
};

export const EditBanner = ({ defaultBanner }: { defaultBanner?: string }) => {
  const t = useTranslations("editUser");
  const { errors, inputErrors, deleteInputErrorProperty, isPending } =
    useEditUser();
  const { files } = useInputFile();
  const { previewUrls } = usePreviewUrls({ defaultUrl: defaultBanner, files });

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full max-w-2xl mx-auto p-4">
        {previewUrls?.length ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <h3 className="text-sm font-medium">{t("banner.preview")}</h3>
            <div className="relative w-full aspect-video overflow-hidden border-4 border-fg-2">
              <img
                src={previewUrls[0]}
                alt={t("banner.previewAlt")}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
      <FileInput
        onChange={() => deleteInputErrorProperty("banner")}
        name="banner"
        id="banner-input"
        error={inputErrors?.banner}
      />

      <FormComponent.SubmitButton
        isPending={isPending}
        disabled={!files?.length || isPending}
      >
        {t("update")}
      </FormComponent.SubmitButton>

      {errors && errors.length > 0 ? <Errors errors={errors} /> : null}
    </div>
  );
};

export const EditProfile = ({
  user,
}: {
  user: {
    name?: string | null;
    surname?: string | null;
    profession?: string | null;
    short_biography?: string | null;
  };
}) => {
  const t = useTranslations("editUser");
  const { errors, inputErrors, deleteInputErrorProperty, isPending } =
    useEditUser();

  return (
    <div className="w-full flex flex-col gap-4">
      <FormComponent.LabelInput
        label={t("profile.firstName.label")}
        type="text"
        id="name"
        name="name"
        defaultValue={user?.name || undefined}
        placeholder={t("profile.firstName.placeholder")}
        autoComplete="given-name"
        required
        autoFocus
        error={inputErrors?.name}
        onChange={() => deleteInputErrorProperty("name")}
      />

      <FormComponent.LabelInput
        label={t("profile.lastName.label")}
        type="text"
        id="surname"
        name="surname"
        defaultValue={user?.surname || undefined}
        placeholder={t("profile.lastName.placeholder")}
        autoComplete="family-name"
        required
        error={inputErrors?.surname}
        onChange={() => deleteInputErrorProperty("surname")}
      />

      <FormComponent.LabelInput
        label={t("profile.profession.label")}
        type="text"
        id="profession"
        name="profession"
        defaultValue={user?.profession || undefined}
        placeholder={t("profile.profession.placeholder")}
        autoComplete="organization-title"
        error={inputErrors?.profession}
        onChange={() => deleteInputErrorProperty("profession")}
      />

      <FormComponent.LabelTextarea
        label={t("profile.shortBio.label")}
        id="short_biography"
        name="short_biography"
        defaultValue={user?.short_biography || undefined}
        placeholder={t("profile.shortBio.placeholder")}
        rows={4}
        error={inputErrors?.short_biography}
        onChange={() => deleteInputErrorProperty("short_biography")}
      />

      <FormComponent.SubmitButton isPending={isPending} disabled={isPending}>
        {t("update")}
      </FormComponent.SubmitButton>

      {errors && errors.length > 0 ? <Errors errors={errors} /> : null}
    </div>
  );
};

export const EditCategories = () => {
  const t = useTranslations("editUser");
  const { errors, isPending } = useEditUser();
  const { categoriesSelected } = useUpdateCategories();
  const inputCategoryIds = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputCategoryIds.current) {
      inputCategoryIds.current.value = "";
      if (categoriesSelected.length > 0) {
        inputCategoryIds.current.value = categoriesSelected.reduce(
          (acc, curr, idx) => {
            let str = `${acc}${curr.id}`;
            if (idx !== categoriesSelected.length - 1) str += ",";
            return str;
          },
          "",
        );
      }
    }
  }, [categoriesSelected]);

  return (
    <div className="w-full flex flex-col gap-4">
      <UserCategoriesComponent />
      <input ref={inputCategoryIds} type="text" name="categories" hidden />
      <FormComponent.SubmitButton
        className="sticky bottom-0"
        isPending={isPending}
        disabled={
          categoriesSelected.length === 0 ||
          categoriesSelected.length > 10 ||
          isPending
        }
      >
        {t("update")}
      </FormComponent.SubmitButton>

      {errors && errors.length > 0 ? <Errors errors={errors} /> : null}
    </div>
  );
};
