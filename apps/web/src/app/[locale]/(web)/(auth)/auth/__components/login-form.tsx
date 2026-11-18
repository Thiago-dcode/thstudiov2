"use client";

import {
  type RedirectToKey,
  resolveRedirectToTarget,
} from "@repo/common-lib/constants/redirect-to";
import { Errors } from "@repo/ui/components/custom/errors";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import FormComponent from "@/lib/components/form-component";
import { getHomePath } from "@/modules/auth/auth.utils";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { loginServerAction } from "@/modules/auth/server-actions/login.action";
import { deleteRedirectTo } from "@/modules/auth/server-actions/redirect-to.action";
import { PasswordField } from "./password-field";

export const LoginForm = ({
  rememberMe: _rememberMe,
  redirectTo,
}: {
  rememberMe: boolean;
  redirectTo: RedirectToKey | null;
}) => {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const { result, handleSubmit, errors, cleanErrors, isPending, success } =
    useHandleAction({
      action: loginServerAction,
      afterAction: async (result) => {
        if (!result.data) {
          return;
        }
        if (!result.data.token) {
          router.push("/auth/2fa");
          return;
        }
        await deleteRedirectTo();
        const destination = redirectTo
          ? resolveRedirectToTarget(redirectTo)
          : null;
        router.push(
          destination
            ? `/${destination}`
            : getHomePath(result.data.funnel_step),
        );
      },
    });

  return (
    <FormComponent.Container>
      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit}>
        {/* Email Field */}
        <FormComponent.LabelInput
          label={t("emailLabel")}
          type="email"
          id="email"
          name="email"
          defaultValue={result?.inputs?.email}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          autoFocus
          onChange={() => cleanErrors()}
        />

        <PasswordField
          label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          autoComplete="current-password"
          onChange={cleanErrors}
          labelAction={
            <Link
              href="/auth/password-recovery"
              className="text-xs text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          }
        />

        {/* Submit Button */}
        <FormComponent.SubmitButton
          success={success}
          isPending={isPending}
          variant="accent"
          className="mt-3"
        >
          {t("submit")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
