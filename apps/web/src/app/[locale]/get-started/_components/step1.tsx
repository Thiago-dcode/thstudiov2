"use client";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import FormComponent from "@/lib/components/form-component";
import {
  ButtonSubmitFunnel,
  ContainerFormFunnel,
  useFunnelActions,
  useFunnelState,
} from "./funnel.provider";

export default function Step1() {
  const t = useTranslations("editUser.profile");
  const { user, setInputs, handleOnChange } = useFunnelActions();
  const { inputs } = useFunnelState();
  const nameRef = useRef<HTMLInputElement>(null);
  const surnameRef = useRef<HTMLInputElement>(null);
  const professionRef = useRef<HTMLInputElement>(null);
  const shortBioRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInputs(
      nameRef?.current,
      surnameRef?.current,
      professionRef?.current,
      shortBioRef?.current,
    );
  }, [setInputs]);
  return (
    <ContainerFormFunnel>
      <FormComponent.LabelInput
        ref={nameRef}
        label={t("firstName.label")}
        type="text"
        id="name"
        name="name"
        defaultValue={
          inputs?.name || (user as { name?: string })?.name || undefined
        }
        placeholder={t("firstName.placeholder")}
        autoComplete="given-name"
        required
        autoFocus
        onChange={handleOnChange}
      />

      {/* Surname Field */}
      <FormComponent.LabelInput
        ref={surnameRef}
        label={t("lastName.label")}
        type="text"
        id="surname"
        name="surname"
        defaultValue={
          inputs?.surname ||
          (user as { surname?: string })?.surname ||
          undefined
        }
        placeholder={t("lastName.placeholder")}
        autoComplete="family-name"
        required
        onChange={handleOnChange}
      />
      {/* Profession Field */}
      <FormComponent.LabelInput
        ref={professionRef}
        label={t("profession.label")}
        type="text"
        id="profession"
        name="profession"
        max={100}
        defaultValue={
          inputs?.profession || (user as any)?.profession || undefined
        }
        placeholder={t("profession.placeholder")}
        autoComplete="organization-title"
        onChange={handleOnChange}
      />

      {/* Description Field */}
      <FormComponent.LabelTextarea
        ref={shortBioRef}
        label={t("shortBio.label")}
        id="short_biography"
        name="short_biography"
        defaultValue={
          inputs?.short_biography || (user as any)?.short_biography || undefined
        }
        placeholder={t("shortBio.placeholder")}
        rows={4}
        onChange={handleOnChange}
      />
      <div>
        <ButtonSubmitFunnel />
      </div>
    </ContainerFormFunnel>
  );
}
