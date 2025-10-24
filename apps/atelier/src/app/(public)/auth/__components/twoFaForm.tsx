'use client';
import { useSession } from "@/modules/auth/contexts/session.provider";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { verify2faServerAction } from "@/modules/auth/server-actions/twofa.action";
import { BaseUser } from "@/modules/users/schemas/users.types";
import { Errors } from "@repo/ui/components/custom/errors";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@repo/ui/components/shadcn/input";

export const TwoFaForm = ({ baseUser }: { baseUser: BaseUser }) => {
  const route = useRouter();
  const { setSession } = useSession();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { handleSubmit, errors, isPending } = useHandleAction({
    action: verify2faServerAction,
    afterAction: async (result) => {
      if (result.data) {
        setSession(result.data);
        route.push('/atelier')
      }
    }
  })
  const [twafaCode, setTwofaCode] = useState<string>()


  return (
    <div className="w-full flex items-center flex-col gap-4">


      <form ref={formRef} onSubmit={handleSubmit} className="w-full flex flex-col gap-8">

        <input type="hidden" name="email" value={baseUser.email} />

        <div className=" w-full flex flex-col gap-2">
          <Input
            onChange={(e) => {
              if (isPending) return;
              const value = e.target.value.trim();
              setTwofaCode(value);
              if (value.length === 6 && formRef.current) {
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

        </div>

      </form>
      {errors && errors.length > 0 && (
        <Errors title="Verification failed" errors={errors} />
      )}

    </div>
  )
}