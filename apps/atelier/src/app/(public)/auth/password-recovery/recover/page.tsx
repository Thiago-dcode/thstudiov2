import { getPasswordRecoveryAttemptCookie, PasswordUpdateAction, setPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import authService from "@/modules/auth/auth.service";

export default async function PasswordRecoveryRecover({ searchParams }: { searchParams: Promise<{ attempt?: string, "errors[]"?: string[] | string, success?: string }> }) {
    const [{attempt, "errors[]": _errors, success}, passwordRecoveryAttemptCookie]= await Promise.all([searchParams,getPasswordRecoveryAttemptCookie()]);
    if (!attempt) {
        redirect('/auth/password-recovery');
    }
    //If there is no cookie, it means that the user open the link in another browser.
    if (passwordRecoveryAttemptCookie) {

        const expiresAt = new Date(passwordRecoveryAttemptCookie.expires_at);
        if (expiresAt < new Date() || passwordRecoveryAttemptCookie.code_validated) {
            console.log('redirecting to password recovery');
            redirect('/auth/password-recovery');
        }
      
    }
    const errors: string[] = typeof _errors === 'string' ? [_errors] : _errors || [];


    //TODO: validate the attempt
    const result = await authService.validatePasswordRecoveryAttempt({ code: attempt });
    if (result.error || result.data === null) {
        redirect('/auth/password-recovery');
    }
    const expiresAt = new Date(result.data.expires_at);
    if (expiresAt < new Date() || result.data.code_validated) {
        redirect('/auth/password-recovery');
    }
    const totalSeconds = Math.floor((expiresAt.getTime() - new Date().getTime()) / 1000);
    const remainingMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    await setPasswordRecoveryAttemptCookie(result.data);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Set New Password
                        </h1>
                        <p className="text-sm text-slate-600">
                            Choose a strong password for your account
                        </p>
                    </div>

                    {/* Timer Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 text-center">
                            ⏱️ This link expires in {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-800 mb-1">Success!</p>
                            <p className="text-sm text-green-700">
                                {success}
                            </p>
                        </div>
                    )}

                    {/* Error Messages */}
                    {errors && errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-red-800 mb-1">Failed to reset password</p>
                            <ul className="text-sm text-red-700 space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-5" action={PasswordUpdateAction}>
                        {/* Hidden attempt field */}
                        <input type="hidden" name="attempt" value={attempt} />

                        {/* New Password Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700"
                            >
                                New Password
                            </label>
                            <input
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
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <p className="text-xs font-medium text-slate-700 mb-2">Password requirements:</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• At least 8 characters long</li>
                                <li>• Contains uppercase and lowercase letters</li>
                                <li>• Contains at least one number</li>
                                <li>• Contains at least one special character</li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Reset Password
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">
                                Changed your mind?
                            </span>
                        </div>
                    </div>

                    {/* Back to Login Link */}
                    <Link
                        href="/auth/login"
                        className="block text-center w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        Back to Sign In
                    </Link>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-slate-500">
                    Need help?{' '}
                    <Link href="/support" className="text-blue-600 hover:text-blue-700 underline">
                        Contact Support
                    </Link>
                </p>
            </div>
        </div>
    )
}
