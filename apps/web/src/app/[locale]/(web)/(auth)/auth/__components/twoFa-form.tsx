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
      const fallback = user.is_new ? "/get-started" : "/atelier";
      const destination = redirectTo
        ? resolveRedirectToTarget(redirectTo)
        : null;
      await deleteRedirectTo();
      route.push(destination ? `/${destination}` : fallback);
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
              const value = e.target.value.trim().toLowerCase();
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
            maxLength={6}
            value={twafaCode}
            autoComplete="one-time-code"
            inputMode="numeric"
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
