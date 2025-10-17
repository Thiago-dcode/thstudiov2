'use client';
import { useSession } from "@/modules/auth/contexts/session.provider";
import { verify2faServerAction } from "@/modules/auth/server-actions/twofa.action";
import { Errors } from "@repo/ui/components/custom/errors";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export const TwoFaForm = ({ email }: { email: string }) => {
  const [errors, setErrors] = useState<string[]>([]);
  const route = useRouter();
  const { setSession } = useSession();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    //TODO
    const result = await verify2faServerAction(formData);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setSession(result.data);
    route.push('/atelier')
  }
  return (
    <div>
      {/* Error Messages */}
      {errors && errors.length > 0 && (
        <Errors title="Verification failed" errors={errors} />
      )}

      {/* Form */}
      <form onSubmit={async (e) => {
        await handleSubmit(e)
      }} className="space-y-6">
        <input type="hidden" name="email" value={email} />

        <div className="space-y-2">
          <label
            htmlFor="twofa_code"
            className="block text-sm font-medium text-slate-700"
          >
            Verification Code
          </label>
          <input
            type="text"
            id="twofa_code"
            name="twofa_code"
            maxLength={6}
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="Enter 6-digit code"
            required
            autoFocus
            className="w-full px-4 py-3 text-center text-lg font-semibold tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:font-normal placeholder:text-slate-400 placeholder:tracking-normal"
          />
          <p className="text-xs text-slate-500 text-center">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Verify Code
        </button>
      </form>
    </div>
  )
}