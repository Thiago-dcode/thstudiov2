"use client";

import { TURNSTILE_ACTIONS } from "@repo/common-lib/constants/turnstile";
import { Errors } from "@repo/ui/components/custom/errors";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/track";
import FormComponent from "@/lib/components/form-component";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/lib/components/turnstile-widget";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { registerServerAction } from "@/modules/auth/server-actions/register.action";
import { PasswordField } from "./password-field";

export const RegisterForm = ({
  children,
  initialEmail,
  turnstileSiteKey,
}: {
  children?: ReactNode;
  initialEmail?: string;
  turnstileSiteKey: string;
}) => {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const turnstileStatusId = useId();
  const { result, handleSubmit, errors, inputErrors, cleanErrors, isPending } =
    useHandleAction({
      action: registerServerAction,
      afterAction: async (result) => {
        if (!result.data) {
          // A token is single-use: any failed submit needs a fresh one.
          turnstileRef.current?.reset();
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

        <PasswordField
          label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          autoComplete="new-password"
          error={inputErrors?.password}
          onChange={handleFieldChange}
        />
        {/* Contract acceptance + age (Terms §2) is given by submitting: the agreement line under
            the button says so, and the server action still requires this field. */}
        <input type="hidden" name="accept_terms" value="on" />
        {inputErrors?.accept_terms && (
          <p className="text-xs! text-red-500">{inputErrors.accept_terms}</p>
        )}
        <TurnstileWidget
          ref={turnstileRef}
          siteKey={turnstileSiteKey}
          action={TURNSTILE_ACTIONS.SIGNUP}
          onTokenChange={setTurnstileToken}
          statusId={turnstileStatusId}
        />
        {children}
        {/* Submit Button: `disabled` replaces SubmitButton's own, so it keeps `isPending`. */}
        <FormComponent.SubmitButton
          isPending={isPending}
          disabled={isPending || !turnstileToken}
          aria-describedby={turnstileToken ? undefined : turnstileStatusId}
          className="mt-3"
        >
          {t("submit")}
        </FormComponent.SubmitButton>
      </FormComponent.Form>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
