'use client';
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { verify2faServerAction } from "@/modules/auth/server-actions/twofa.action";
import { Errors } from "@repo/ui/components/custom/errors";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { TwoFaUser } from "@/modules/auth/auth.types";
import FormComponent from "@/lib/components/form-component";

export const TwoFaForm = ({ user }: { user: TwoFaUser }) => {
  const route = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { handleSubmit, errors, cleanErrors, isPending } = useHandleAction({
    action: verify2faServerAction,
    afterAction: async (result) => {
      if (result.data) {
        route.push(user.is_new ? '/get-started' : '/atelier');
      }
    }
  })
  const [twafaCode, setTwofaCode] = useState('')


  return (
    <FormComponent.Container>


      <form ref={formRef} onSubmit={handleSubmit} className="w-full h-full flex flex-col gap-4">

        <input type="hidden" name="email" value={user.email} />

        <FormComponent.Field>
          <Input
            onChange={(e) => {
              if (isPending) return;
              const value = e.target.value.trim().toLowerCase();
              e.target.value = value;
              setTwofaCode(value);
              if (errors) {
                cleanErrors()
              }
              if (value.length === 6 && formRef?.current) {
                formRef.current.requestSubmit()
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
            placeholder="Enter 6-digit code"
            required
            autoFocus
            className="w-full px-4 py-6 text-center text-lg font-semibold tracking-widest  rounded-lg focus:outline-none transition-all placeholder:font-normal placeholder:tracking-normal"
          />

        </FormComponent.Field>

      </form>
      {errors && errors.length > 0 && (
        <Errors  errors={errors} />
      )}

    </FormComponent.Container>
  )
}