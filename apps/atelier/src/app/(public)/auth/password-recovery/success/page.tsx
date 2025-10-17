import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PasswordRecoverySuccess() {
    const passwordRecoveryAttemptCookie = await getPasswordRecoveryAttemptCookie();
    if (!passwordRecoveryAttemptCookie) {
        redirect('/auth/password-recovery');
    }
    const expiresAt = new Date(passwordRecoveryAttemptCookie.expires_at);
    if (expiresAt < new Date() || passwordRecoveryAttemptCookie.code_validated) {
        redirect('/auth/password-recovery');
    }
    const totalSeconds = Math.floor((expiresAt.getTime() - new Date().getTime()) / 1000);
    const remainingMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
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
                                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Check Your Email
                        </h1>
                        <p className="text-sm text-slate-600">
                            We've sent a password recovery link to your email address
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium text-blue-900">
                            What to do next:
                        </p>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Check your inbox (and spam folder)</li>
                            <li>Click the recovery link in the email</li>
                            <li>Create your new password</li>
                        </ol>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center">
                        <p className="text-xs text-slate-500">
                            The recovery link will expire in {remainingMinutes} minutes and {remainingSeconds} seconds
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">
                                Didn't receive the email?
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Link
                            href="/auth/password-recovery"
                            className="block text-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Try Again
                        </Link>
                        <Link
                            href="/auth/login"
                            className="block text-center w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
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