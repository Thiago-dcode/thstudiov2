"use client";

import { Errors } from "@repo/ui/components/custom/errors";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { passwordRecoveryAction } from "@/modules/auth/server-actions/password-recovery.action";

export const PasswordRecoveryForm = () => {
  const t = useTranslations("auth.passwordRecovery");
  const router = useRouter();
  const { isPending, handleSubmit, errors, success, cleanErrors } =
    useHandleAction({
      action: passwordRecoveryAction,
      afterAction: async (result) => {
        if (result.data) {
          router.push("/auth/password-recovery/success");
        }
      },
    });

  return (
    <FormComponent.Container>
      {/* Error Messages */}
      {errors && errors.length > 0 && <Errors errors={errors} />}

      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit}>
        {/* Email Field */}
        <FormComponent.LabelInput
          label={t("emailLabel")}
          htmlFor="email"
          name="email"
          placeholder={t("emailPlaceholder")}
          required
          autoComplete="email"
          autoFocus
          onChange={() => cleanErrors()}
        />
        {/* Submit Button */}

        {/* Submit Button */}
        <FormComponent.SubmitButton success={success} isPending={isPending}>
          {t("submit")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>
    </FormComponent.Container>
  );
};
