import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteCookie } from "@/lib/utils";
import { PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME } from "@repo/common-lib/constants";

export default async function PasswordUpdateSuccess() {

    const passwordRecoveryAttempt = await getPasswordRecoveryAttemptCookie();
    if (!passwordRecoveryAttempt) {
        redirect('/auth/password-recovery');
    }
    if (!passwordRecoveryAttempt.code_validated) {
        redirect('/auth/password-recovery');
    }
    await deleteCookie(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                    {/* Success Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Password Updated Successfully
                        </h1>
                        <p className="text-sm text-slate-600">
                            Your password has been changed. You can now sign in with your new password.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <Link
                            href="/auth/login"
                            className="block text-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Continue to Sign In
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-slate-500">
                    Need help?{' '}
                    <Link href="#" className="text-blue-600 hover:text-blue-700 underline">
                        Contact Support
                    </Link>
                </p>
            </div>
        </div>
    )
}