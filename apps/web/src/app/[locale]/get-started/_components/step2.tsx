"use client";
import { FileInput } from "@repo/ui/components/custom/file-input";
import {
  FileInputProvider,
  useInputFile,
} from "@repo/ui/contexts/file.provider";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  ButtonStepBackFunnel,
  ButtonSubmitFunnel,
  ContainerFormFunnel,
  useFunnelActions,
} from "./funnel.provider";

export default function Container() {
  return (
    <FileInputProvider
      allowedMimeTypes={["image/jpeg", "image/jpg", "image/png", "image/webp"]}
    >
      <Step2 />
    </FileInputProvider>
  );
}

const Step2 = () => {
  const t = useTranslations("editUser.avatar");
  const tRoot = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, setInputs, handleOnChange, setErrors } = useFunnelActions();
  const { files, errors, maxFileSizeBytes } = useInputFile();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    (user as any)?.avatar,
  );
  const avatarUrl = (user as { avatar?: string })?.avatar;
  useEffect(() => {
    if (files && files.length > 0) {
      const file = files[0];
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(undefined);
    }
  }, [files]);
  useEffect(() => {
    if (!errors?.length) return;
    setErrors(
      errors.map(({ code, fileName }) =>
        code === "too_large"
          ? tRoot("validation.file.tooLarge", {
              field: fileName,
              mb: Math.floor((maxFileSizeBytes ?? 0) / (1024 * 1024)),
            })
          : tRoot("validation.file.invalidType", { field: fileName }),
      ),
    );
  }, [errors, setErrors, tRoot, maxFileSizeBytes]);

  useEffect(() => {
    setInputs(inputRef?.current);
  }, [setInputs]);

  useEffect(() => {
    if (!avatarUrl) return;
    setPreviewUrl((current) => (current === avatarUrl ? current : avatarUrl));
  }, [avatarUrl]);

  return (
    <ContainerFormFunnel>
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-4">
        {previewUrl && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <h3 className="text-sm font-medium">{t("preview")}</h3>
            <div className="relative w-32 h-32 overflow-hidden border-4 border-fg-2">
              <img
                src={previewUrl}
                alt={t("previewAlt")}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
      <FileInput
        onChange={() => {
          handleOnChange();
        }}
        ref={inputRef}
        name="avatar"
        id="avatar-input"
      />

      <ButtonSubmitFunnel />

      <ButtonStepBackFunnel />
    </ContainerFormFunnel>
  );
};
