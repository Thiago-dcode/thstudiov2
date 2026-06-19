"use client";

import { Errors } from "@repo/ui/components/custom/errors";
import { Label } from "@repo/ui/components/shadcn/label";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createUserContactAction } from "@/modules/user-contacts/server-actions/create-user-contact.action";

export function SupportForm({
  supportUserId,
  defaultName,
  defaultEmail,
}: {
  supportUserId: number;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("support");
  const formRef = useRef<HTMLFormElement>(null);

  const subjectList = t.raw("subjects") as { value: string; label: string }[];

  const { handleSubmit, isPending, inputErrors, errors, success } =
    useHandleAction({
      action: (formData) => {
        formData.set("user_id", `${supportUserId}`);
        return createUserContactAction(formData);
      },
      afterAction: async (result) => {
        if (result.data) {
          toast.success(t("formContainer.successToast"));
          formRef.current?.reset();
          if (formRef.current) {
            const nameInput = formRef.current.elements.namedItem(
              "name",
            ) as HTMLInputElement | null;
            const emailInput = formRef.current.elements.namedItem(
              "email",
            ) as HTMLInputElement | null;
            if (nameInput) {
              nameInput.value = defaultName ?? "";
            }
            if (emailInput) {
              emailInput.value = defaultEmail ?? "";
            }
          }
          return;
        }

        if (result.errors) {
          for (const error of result.errors) {
            toast.error(error);
          }
        }
      },
    });

  return (
    <FormComponent.Container>
      <FormComponent.Form
        ref={formRef}
        onSubmit={handleSubmit}
        className="gap-4"
      >
        <FormComponent.LabelInput
          label={t("formContainer.nameLabel")}
          name="name"
          id="support-name"
          placeholder={t("formContainer.namePlaceholder")}
          required
          defaultValue={defaultName}
          error={inputErrors?.name}
        />

        <FormComponent.LabelInput
          label={t("formContainer.emailLabel")}
          name="email"
          id="support-email"
          type="email"
          placeholder={t("formContainer.emailPlaceholder")}
          required
          defaultValue={defaultEmail}
          error={inputErrors?.email}
        />

        <div className="space-y-1 w-full">
          <Label
            htmlFor="support-subject"
            className="block text-xs tracking-wide text-text-muted"
          >
            {t("formContainer.subjectLabel")}{" "}
            <span className="span-label text-red-500">*</span>
          </Label>
          <select
            id="support-subject"
            name="subject"
            required
            defaultValue={subjectList[0].value}
            className="h-12 w-full border border-border bg-bg px-3 text-sm outline-none ring-offset-bg transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {subjectList.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {inputErrors?.subject ? (
            <p className="text-xs text-red-500 mt-1">{inputErrors.subject}</p>
          ) : null}
        </div>

        <FormComponent.LabelTextarea
          label={t("formContainer.messageLabel")}
          name="message"
          id="support-message"
          placeholder={t("formContainer.messagePlaceholder")}
          required
          rows={6}
          error={inputErrors?.message}
        />

        <Errors errors={errors || []} />

        <FormComponent.SubmitButton
          isPending={isPending}
          success={success}
          className="h-12"
        >
          {t("formContainer.submitButton")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>
    </FormComponent.Container>
  );
}
