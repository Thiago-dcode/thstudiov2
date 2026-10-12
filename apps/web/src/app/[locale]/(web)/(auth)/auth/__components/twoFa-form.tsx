"use client";
import {
  type RedirectToKey,
  resolveRedirectToTarget,
} from "@repo/common-lib/constants/redirect-to";
import { Errors } from "@repo/ui/components/custom/errors";
import { Input } from "@repo/ui/components/shadcn/input";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import FormComponent from "@/lib/components/form-component";
import type { TwoFaUser } from "@/modules/auth/auth.types";
import { getHomePath } from "@/modules/auth/auth.utils";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { deleteRedirectTo } from "@/modules/auth/server-actions/redirect-to.action";
import { verify2faServerAction } from "@/modules/auth/server-actions/twofa.action";

export const TwoFaForm = ({
  user,
  redirectTo,
}: {
  user: TwoFaUser;
  redirectTo: RedirectToKey | null;
}) => {
  const t = useTranslations("auth.twoFa");
  const route = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { handleSubmit, errors, cleanErrors, isPending } = useHandleAction({
    action: verify2faServerAction,
    afterAction: async (result) => {
      if (!result.data) {
        return;
      }
      const destination = redirectTo
        ? resolveRedirectToTarget(redirectTo)
        : null;
      await deleteRedirectTo();
      route.push(
        destination ? `/${destination}` : getHomePath(result.data.funnel_step),
      );
    },
  });
  const [twafaCode, setTwofaCode] = useState("");

  return (
    <FormComponent.Container>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="w-full h-full flex flex-col gap-4"
      >
        <input type="hidden" name="email" value={user.email} />

        <FormComponent.Field>
          <Input
            onChange={(e) => {
              if (isPending) return;
              // Codes are digits only; drop anything else (spaces from a pasted "123 456" too).
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              e.target.value = value;
              setTwofaCode(value);
              if (errors) {
                cleanErrors();
              }
              if (value.length === 6 && formRef?.current) {
                formRef.current.requestSubmit();
              }
            }}
            disabled={isPending}
            type="text"
            id="twofa_code"
            name="twofa_code"
            value={twafaCode}
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="\d{6}"
            placeholder={t("codePlaceholder")}
            required
            autoFocus
            className="w-full px-4 py-6 text-center text-lg font-semibold tracking-widest"
          />
        </FormComponent.Field>
      </form>
      {errors && errors.length > 0 && <Errors errors={errors} />}
    </FormComponent.Container>
  );
};
