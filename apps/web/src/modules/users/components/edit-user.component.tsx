"use client";

import { MAX_CATEGORIES_USER } from "@repo/common-lib/constants/constants";
import type { CategoryBase } from "@repo/common-lib/types/category";
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
import { Label } from "@repo/ui/components/shadcn/label";
import {
  FileInputProvider,
  useInputFile,
} from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { cn } from "@repo/ui/lib/utils";
import { Globe, Pen, Phone, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import FormComponent from "@/lib/components/form-component";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/lib/components/social-icons";
import { CreateOrUpdateAddress } from "@/modules/addresses/components/create-or-update-address";
import CategoryCombobox from "@/modules/categories/components/category-combobox";
import {
  GetCategoriesProvider,
  useGetCategories,
} from "@/modules/categories/providers/getCategories.provider";
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
  const [openContact, setOpenContact] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSetOpen = (
    value: boolean,
    dialog:
      | "profile"
      | "avatar"
      | "banner"
      | "categories"
      | "address"
      | "contact",
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
      case "contact":
        setOpenContact(value);
        break;
    }
  };
  const closeAllModals = () => {
    setOpenAvatar(false);
    setOpenBanner(false);
    setOpenProfile(false);
    setOpenCategories(false);
    setOpenAddress(false);
    setOpenContact(false);
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
          <DialogContent className=" max-w-xl w-screen">
            <DialogTitle>{t("banner.editTitle")}</DialogTitle>
            <FormComponent.Container>
              <FormComponent.Form onSubmit={handleSubmit} className=" pt-4">
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
            <DialogContent className="max-w-2xl w-screen">
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
          <DialogContent className="max-w-2xl w-screen">
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
            <h3 className="text-lg font-bold">
              {user.name} {user.surname}
            </h3>
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
        {/* Contact & links section */}
        <section className="flex flex-col items-start justify-start gap-3 pt-8">
          <div className="flex items-center justify-start gap-2">
            <h4 className="text-text-muted">{t("contact.title")}</h4>
            <Dialog
              open={openContact}
              onOpenChange={(value) => handleSetOpen(value, "contact")}
            >
              <DialogTrigger className="p-2 bg-fg hover:bg-fg-2 transition-opacity cursor-pointer">
                <Pen className="size-3" aria-hidden />
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogTitle>{t("contact.editTitle")}</DialogTitle>
                <DialogDescription className="text-pretty">
                  {t("contact.description")}
                </DialogDescription>
                <FormComponent.Container>
                  <FormComponent.Form
                    onSubmit={handleSubmit}
                    className="max-w-xl pt-4"
                  >
                    <EditContactLinks user={user} />
                  </FormComponent.Form>
                </FormComponent.Container>
              </DialogContent>
            </Dialog>
          </div>
          <ContactLinksSummary user={user} />
        </section>
        {/*Categories section */}
        <section className="flex flex-col items-start justify-start gap-1 pt-8">
          <div className="flex items-center justify-start gap-2">
            <h4 className="text-text-muted">{t("categories.title")}</h4>
            <Dialog
              open={openCategories}
              onOpenChange={(value) => handleSetOpen(value, "categories")}
            >
              <DialogTrigger className="p-2 bg-fg hover:bg-fg-2 transition-opacity cursor-pointer">
                <Pen className="size-3" />
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogTitle>{t("categories.editTitle")}</DialogTitle>
                <FormComponent.Container>
                  <FormComponent.Form
                    onSubmit={handleSubmit}
                    className="max-w-xl pt-4"
                  >
                    <EditCategories userCategories={userCategories} />
                  </FormComponent.Form>
                </FormComponent.Container>
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
export const EditAvatar = ({
  defaultAvatar,
}: {
  defaultAvatar?: string | null;
}) => {
  const t = useTranslations("editUser");
  const { errors, inputErrors, deleteInputErrorProperty, isPending } =
    useEditUser();
  const { files } = useInputFile();
  const { previewUrls } = usePreviewUrls({
    defaultUrl: defaultAvatar ?? undefined,
    files,
  });

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flexw-full max-w-2xl mx-auto p-4">
        {previewUrls?.length ? (
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
        ) : null}
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

export const EditBanner = ({
  defaultBanner,
}: {
  defaultBanner?: string | null;
}) => {
  const t = useTranslations("editUser");
  const { errors, inputErrors, deleteInputErrorProperty, isPending } =
    useEditUser();
  const { files, setFiles } = useInputFile();
  const { previewUrls } = usePreviewUrls({
    defaultUrl: defaultBanner ?? undefined,
    files,
  });
  const [removed, setRemoved] = useState(false);

  const displayUrl = removed ? undefined : previewUrls?.[0];
  const canSubmit =
    Boolean(files?.length) || (removed && Boolean(defaultBanner));

  const handleRemove = () => {
    setRemoved(true);
    deleteInputErrorProperty("banner");
    if (files?.length) {
      setFiles(new DataTransfer().files);
    }
    const input = document.getElementById(
      "banner-input",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full max-w-2xl mx-auto p-4">
        {displayUrl ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <h3 className="text-sm font-medium">{t("banner.preview")}</h3>
            <div className="relative w-full aspect-video overflow-hidden border-4 border-fg-2">
              <label
                htmlFor="banner-input"
                className="absolute inset-0 z-0 cursor-pointer"
              >
                <img
                  src={displayUrl}
                  alt={t("banner.previewAlt")}
                  className="w-full h-full object-cover"
                />
                <span className="sr-only">{t("banner.change")}</span>
              </label>
              {(defaultBanner || files?.length) && !isPending ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 z-10 p-2 bg-fg hover:bg-fg-2 transition-colors cursor-pointer"
                  aria-label={t("banner.remove")}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {removed ? (
        <input type="hidden" name="remove_banner" value="true" />
      ) : null}
      <FileInput
        onChange={() => {
          setRemoved(false);
          deleteInputErrorProperty("banner");
        }}
        name="banner"
        id="banner-input"
        error={inputErrors?.banner}
      />

      <FormComponent.SubmitButton
        isPending={isPending}
        disabled={!canSubmit || isPending}
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

type ContactLinksUser = {
  phone_number?: string | null;
  facebook_link?: string | null;
  website_link?: string | null;
  instagram_link?: string | null;
  youtube_link?: string | null;
};

const CONTACT_ICONS = {
  phone: Phone,
  website: Globe,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
} as const;

export const ContactLinksSummary = ({ user }: { user: ContactLinksUser }) => {
  const t = useTranslations("editUser");

  const items = [
    {
      key: "phone" as const,
      value: user.phone_number,
      href: user.phone_number ? `tel:${user.phone_number}` : null,
      external: false,
    },
    {
      key: "website" as const,
      value: user.website_link,
      href: user.website_link ?? null,
      external: true,
    },
    {
      key: "instagram" as const,
      value: user.instagram_link,
      href: user.instagram_link ?? null,
      external: true,
    },
    {
      key: "facebook" as const,
      value: user.facebook_link,
      href: user.facebook_link ?? null,
      external: true,
    },
    {
      key: "youtube" as const,
      value: user.youtube_link,
      href: user.youtube_link ?? null,
      external: true,
    },
  ].filter((item) => item.value);

  if (items.length === 0) {
    return <p className="text-sm text-text-muted">{t("contact.empty")}</p>;
  }

  return (
    <ul className="flex w-full flex-col gap-2">
      {items.map(({ key, value, href, external }) => {
        const Icon = CONTACT_ICONS[key];
        return (
          <li
            key={key}
            className="flex min-w-0 items-center gap-2 text-sm text-text-muted"
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {href ? (
              <a
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
                className="truncate transition-colors hover:text-text"
              >
                {value}
              </a>
            ) : (
              <span className="truncate">{value}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const EditContactLinks = ({ user }: { user: ContactLinksUser }) => {
  const t = useTranslations("editUser");
  const { errors, inputErrors, deleteInputErrorProperty, isPending } =
    useEditUser();

  return (
    <div className="w-full flex flex-col gap-4">
      <FormComponent.LabelInput
        label={t("contact.phone.label")}
        type="tel"
        inputMode="tel"
        id="phone_number"
        name="phone_number"
        defaultValue={user?.phone_number || undefined}
        placeholder={t("contact.phone.placeholder")}
        autoComplete="tel"
        extraInfo={t("contact.phone.hint")}
        error={inputErrors?.phone_number}
        onChange={() => deleteInputErrorProperty("phone_number")}
      />

      <FormComponent.LabelInput
        label={t("contact.instagram.label")}
        type="text"
        inputMode="text"
        id="instagram_link"
        name="instagram_link"
        defaultValue={user?.instagram_link || undefined}
        placeholder={t("contact.instagram.placeholder")}
        autoComplete="off"
        extraInfo={t("contact.instagram.hint")}
        error={inputErrors?.instagram_link}
        onChange={() => deleteInputErrorProperty("instagram_link")}
      />

      <FormComponent.LabelInput
        label={t("contact.facebook.label")}
        type="text"
        inputMode="text"
        id="facebook_link"
        name="facebook_link"
        defaultValue={user?.facebook_link || undefined}
        placeholder={t("contact.facebook.placeholder")}
        autoComplete="off"
        extraInfo={t("contact.facebook.hint")}
        error={inputErrors?.facebook_link}
        onChange={() => deleteInputErrorProperty("facebook_link")}
      />

      <FormComponent.LabelInput
        label={t("contact.youtube.label")}
        type="text"
        inputMode="text"
        id="youtube_link"
        name="youtube_link"
        defaultValue={user?.youtube_link || undefined}
        placeholder={t("contact.youtube.placeholder")}
        autoComplete="off"
        extraInfo={t("contact.youtube.hint")}
        error={inputErrors?.youtube_link}
        onChange={() => deleteInputErrorProperty("youtube_link")}
      />

      <FormComponent.LabelInput
        label={t("contact.website.label")}
        type="url"
        inputMode="url"
        id="website_link"
        name="website_link"
        defaultValue={user?.website_link || undefined}
        placeholder={t("contact.website.placeholder")}
        autoComplete="url"
        error={inputErrors?.website_link}
        onChange={() => deleteInputErrorProperty("website_link")}
      />

      <FormComponent.SubmitButton isPending={isPending} disabled={isPending}>
        {t("update")}
      </FormComponent.SubmitButton>

      {errors && errors.length > 0 ? <Errors errors={errors} /> : null}
    </div>
  );
};

const EditCategoriesForm = () => {
  const t = useTranslations("editUser");
  const tCategories = useTranslations("userCategories");
  const { errors, isPending } = useEditUser();
  const { categoriesSelected } = useGetCategories();

  const selectedIds = Array.from(categoriesSelected.values())
    .map((c) => c.id)
    .join(",");

  return (
    <div className="w-full flex flex-col gap-4">
      <p className="text-sm text-text-muted">{tCategories("visibilityHint")}</p>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{tCategories("title")}</Label>
          <span
            className={cn(
              "text-xs text-text-muted tabular-nums",
              categoriesSelected.size >= MAX_CATEGORIES_USER && "text-text",
            )}
          >
            {categoriesSelected.size}/{MAX_CATEGORIES_USER}
          </span>
        </div>
        <CategoryCombobox />
      </div>

      <input
        type="text"
        name="categories"
        hidden
        readOnly
        value={selectedIds}
      />
      <FormComponent.SubmitButton
        className="sticky bottom-0"
        isPending={isPending}
        disabled={categoriesSelected.size === 0 || isPending}
      >
        {t("update")}
      </FormComponent.SubmitButton>

      {errors && errors.length > 0 ? <Errors errors={errors} /> : null}
    </div>
  );
};

export const EditCategories = ({
  userCategories,
}: {
  userCategories: CategoryBase[];
}) => (
  <GetCategoriesProvider
    initialCategories={userCategories}
    maxSelections={MAX_CATEGORIES_USER}
  >
    <EditCategoriesForm />
  </GetCategoriesProvider>
);
