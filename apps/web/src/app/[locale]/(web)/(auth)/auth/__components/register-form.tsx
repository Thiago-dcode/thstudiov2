"use client";

import { normalizeUsername } from "@repo/common-lib/utils/username";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Eye, EyeClosed } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/track";
import FormComponent from "@/lib/components/form-component";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { registerServerAction } from "@/modules/auth/server-actions/register.action";

export const RegisterForm = ({
  children,
  initialEmail,
}: {
  children?: ReactNode;
  initialEmail?: string;
}) => {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const [hidden, setHidden] = useState(true);
  const { result, handleSubmit, errors, inputErrors, cleanErrors, isPending } =
    useHandleAction({
      action: registerServerAction,
      afterAction: async (result) => {
        if (!result.data) {
          return;
        }
        trackEvent("sign_up", { method: "email" });
        router.push(result.data.token ? "/get-started" : "/auth/2fa");
      },
    });

  // Fires once, on the first field the visitor touches (mounting would also count bounces).
  const signupStartedRef = useRef(false);
  const handleFieldChange = () => {
    cleanErrors();
    if (signupStartedRef.current) return;
    signupStartedRef.current = true;
    trackEvent("signup_started");
  };

  return (
    <FormComponent.Container>
      {/* Form */}
      <FormComponent.Form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <FormComponent.LabelInput
          label={t("emailLabel")}
          type="email"
          id="email"
          name="email"
          error={inputErrors?.email}
          defaultValue={result?.inputs?.email ?? initialEmail}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          autoFocus
          onChange={handleFieldChange}
        />

        {/* Username Field */}
        <FormComponent.LabelInput
          label={t("usernameLabel")}
          type="text"
          id="username"
          name="username"
          error={inputErrors?.username}
          defaultValue={result?.inputs?.username}
          placeholder={t("usernamePlaceholder")}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          onChange={(e) => {
            e.target.value = normalizeUsername(e.target.value);
            handleFieldChange();
          }}
        />
        {/* Password Field */}
        <FormComponent.Field>
          <Label htmlFor="password" className="block">
            {t("passwordLabel")}
          </Label>
          <div className="relative">
            <Input
              onChange={() => {
                handleFieldChange();
                setHidden(true);
              }}
              type={hidden ? "password" : "text"}
              id="password"
              name="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setHidden(!hidden);
              }}
              className="absolute top-2 right-2 cursor-pointer flex items-center justify-center text-text-muted"
            >
              {hidden ? (
                <Eye className="size-5" />
              ) : (
                <EyeClosed className="size-5" />
              )}
            </button>
          </div>
          {inputErrors?.password && (
            <p id="error-password" className="text-xs text-red-500 mt-1">
              {inputErrors.password}
            </p>
          )}
        </FormComponent.Field>
        {children}
        {/* Submit Button */}
        <FormComponent.SubmitButton isPending={isPending} variant="accent">
          {t("submit")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
