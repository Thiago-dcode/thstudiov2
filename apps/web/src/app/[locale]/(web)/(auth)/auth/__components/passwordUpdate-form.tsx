"use client";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Eye, EyeClosed } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import FormComponent from "@/lib/components/form-component";
import type { PasswordRecoveryAttempt } from "@/modules/auth/auth.types";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import {
  PasswordUpdateAction,
  setPasswordUpdatedCookie,
} from "@/modules/auth/server-actions/password-update.action";

export const PasswordUpdateForm = ({
  passwordAttempt,
}: {
  passwordAttempt: PasswordRecoveryAttempt;
}) => {
  const t = useTranslations("auth.passwordRecovery");
  const route = useRouter();
  const [hiddenPassword, setHiddenPassword] = useState(true);
  const { result, errors, cleanErrors, handleSubmit, isPending } =
    useHandleAction({
      action: PasswordUpdateAction,
      afterAction: async () => {
        await setPasswordUpdatedCookie();
        route.push("/auth/password-recovery/recover/success");
      },
    });

  return (
    <FormComponent.Container>
      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit}>
        {/* Hidden attempt field */}
        <input
          type="hidden"
          name="attempt"
          value={passwordAttempt.code || result?.inputs?.attempt}
        />

        {/* New Password Field */}
        <FormComponent.Field>
          <Label htmlFor="password" className="block">
            {t("newPasswordLabel")}
          </Label>
          <div className="relative">
            <Input
              onChange={() => {
                cleanErrors();
                setHiddenPassword(true);
              }}
              type={hiddenPassword ? "password" : "text"}
              id="password"
              name="password"
              placeholder={t("newPasswordPlaceholder")}
              autoComplete="new-password"
              required
              autoFocus
              minLength={8}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setHiddenPassword(!hiddenPassword);
              }}
              className="absolute top-2 right-2 cursor-pointer flex items-center justify-center text-text-muted"
            >
              {hiddenPassword ? (
                <Eye className="size-5" />
              ) : (
                <EyeClosed className="size-5" />
              )}
            </button>
          </div>
        </FormComponent.Field>

        {/* Submit Button */}

        {/* Submit Button */}
        <FormComponent.SubmitButton isPending={isPending}>
          {t("resetSubmit")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>

      {/* Error Messages */}
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
