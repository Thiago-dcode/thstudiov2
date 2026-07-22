"use client";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { AboutPage } from "@repo/common-lib/types/about-page";
import { FileInput } from "@repo/ui/components/custom/file-input";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import {
  FileInputProvider,
  useInputFile,
} from "@repo/ui/contexts/file.provider";
import { usePreviewUrls } from "@repo/ui/hooks/usePreviewUrls";
import { cn } from "@repo/ui/lib/utils";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import {
  createAboutPageAction,
  updateAboutPageAction,
} from "../server-actions/create-update-about-page.action";

export const CreateOrUpdateAboutPage = ({
  currentAboutPage,
  variant = "primary",
}: {
  currentAboutPage?: AboutPage;
  variant?:
    | "primary"
    | "outline"
    | "default"
    | "secondary"
    | "ghost"
    | "link"
    | "base"
    | "destructive";
}) => {
  const t = useTranslations("atelier.about.form");
  const [open, setOpen] = useState(false);
  const {
    handleSubmit,
    isPending,
    success,
    deleteInputErrorProperty,
    inputErrors,
    reset,
    cleanErrors,
  } = useHandleAction({
    action: async (formData) => {
      if (!currentAboutPage) {
        return await createAboutPageAction(formData);
      }
      return await updateAboutPageAction(currentAboutPage.id, formData);
    },
    afterAction: async (result) => {
      if (result.data) {
        setOpen(false);
      }
    },
    beforeAction: async () => {
      reset();
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (isPending) return;
        if (!e) cleanErrors();
        setOpen(e);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant as any} size="sm">
          {!currentAboutPage ? (
            <>
              <Plus className="size-4" /> {t("createButton")}
            </>
          ) : (
            <>
              <Pencil className="size-4" /> {t("editButton")}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>
          {!currentAboutPage ? t("createTitle") : t("updateTitle")}
        </DialogTitle>
        <FormComponent.Container className="">
          <FormComponent.Form onSubmit={handleSubmit}>
            <div className="space-y-1">
              <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                <PhotoInput defaultUrl={currentAboutPage?.photo || undefined} />
              </FileInputProvider>
            </div>
            <FormComponent.LabelInput
              onChange={() => deleteInputErrorProperty("title")}
              error={inputErrors?.title}
              defaultValue={currentAboutPage?.title || undefined}
              label={t("titleLabel")}
              required={!currentAboutPage}
              name="title"
              id="title"
              type="text"
              placeholder={t("titlePlaceholder")}
            />
            <FormComponent.LabelTextarea
              onChange={() => deleteInputErrorProperty("description")}
              error={inputErrors?.description}
              rows={8}
              defaultValue={currentAboutPage?.description || undefined}
              label={t("descriptionLabel")}
              required={!currentAboutPage}
              name="description"
              id="description"
              placeholder={t("descriptionPlaceholder")}
            />

            <div className="pt-4">
              <FormComponent.SubmitButton
                isPending={isPending}
                success={success}
              >
                {!currentAboutPage ? t("createSubmit") : t("updateSubmit")}
              </FormComponent.SubmitButton>
            </div>
          </FormComponent.Form>
        </FormComponent.Container>
      </DialogContent>
    </Dialog>
  );
};

const PhotoInput = ({ defaultUrl }: { defaultUrl?: string }) => {
  const t = useTranslations("atelier.about.form");
  const { files } = useInputFile();
  const { previewUrls } = usePreviewUrls({
    defaultUrl,
    files,
  });

  return (
    <div
      className={cn("w-full mx-auto p-4 flex items-center gap-4", {
        "flex-col": !previewUrls?.length,
      })}
    >
      <div>
        {previewUrls?.length ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <h3 className="text-sm font-medium">{t("photoPreview")}</h3>
            <div className="relative aspect-3/4 max-h-[200px] max-w-[150px] sm:max-h-[500px] sm:max-w-[300px] overflow-hidden border-4 border-fg-2">
              <img
                src={previewUrls[0]}
                alt={t("photoPreviewAlt")}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted ">{t("choosePhotoHint")}</p>
        )}
      </div>
      <FileInput name="photo" id="photo-input" />
    </div>
  );
};
