'use client'
import { PasswordRecoveryAttempt } from "@/modules/auth/auth.types"
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { deletePasswordAttemptCookie, setPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action"
import { PasswordUpdateAction, setPasswordUpdatedCookie } from "@/modules/auth/server-actions/password-update.action"
import { Errors } from "@repo/ui/components/custom/errors"
import { Timer } from "@repo/ui/components/custom/Timer"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { ExpiresIn } from "./expiresIn"

export const PasswordUpdateForm = ({ passwordAttempt }: {
    passwordAttempt: PasswordRecoveryAttempt
}) => {
    const route = useRouter();
    const { result, errors, cleanErrors, handleSubmit, isPending } = useHandleAction({
        action: PasswordUpdateAction,
        afterAction: async () => {

            await setPasswordUpdatedCookie();
            route.push('/auth/password-recovery/recover/success')
        }
    })
    useEffect(() => {

        (async () => {

            await setPasswordRecoveryAttemptCookie(passwordAttempt)
        })()
    }, [passwordAttempt])
    const expiresIn = useMemo(() => {
        const expiresAt = new Date(passwordAttempt.expires_at);
        return expiresAt.getTime() - new Date().getTime();
    }, [passwordAttempt])

    return (
        <>
            {/* Error Messages */}
            {errors && (
                <Errors title="Errors during password update" errors={errors} />
            )}

            {/* Timer Warning */}
            <ExpiresIn  expiresIn={expiresIn} redirect='/auth/password-recovery' />

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit} >
                {/* Hidden attempt field */}
                <input type="hidden" name="attempt" value={passwordAttempt.code || result?.inputs?.attempt} />
                {/* New Password Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700"
                    >
                        New Password
                    </label>
                    <input
                        onChange={() => {
                            cleanErrors()
                        }}
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        required
                        autoFocus
                        minLength={8}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="confirm_password"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Confirm Password
                    </label>
                    <input
                        onChange={() => {
                            cleanErrors()
                        }}
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* Password Requirements */}
                {/* <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-700 mb-2">Password requirements:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                        <li>• At least 8 characters long</li>
                    </ul>
                </div> */}

                {/* Submit Button */}
                <button
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {isPending ? 'Updating password...' : ' Reset Password'}
                </button>
            </form></>
    )
}