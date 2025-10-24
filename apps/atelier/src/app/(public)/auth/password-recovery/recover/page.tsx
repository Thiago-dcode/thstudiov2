import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import authService from "@/modules/auth/auth.service";
import { PasswordUpdateForm } from "../../__components/passwordUpdateForm";

export default async function PasswordRecoveryRecover({ searchParams }: { searchParams: Promise<{ attempt?: string }> }) {
    const [{ attempt }, passwordRecoveryAttemptCookie] = await Promise.all([searchParams, getPasswordRecoveryAttemptCookie()]);
    let _passwordRecoveryAttemptCookie = passwordRecoveryAttemptCookie;
    if (!attempt) {
        redirect('/auth/password-recovery');
    }
    //If there is no cookie, it means that the user open the link in another browser.
    if (_passwordRecoveryAttemptCookie) {
        const expiresAt = new Date(_passwordRecoveryAttemptCookie.expires_at);
        if (expiresAt < new Date()) {
            redirect('/auth/password-recovery');
        }
    }
    //TODO: validate the attempt
    if (!_passwordRecoveryAttemptCookie || !_passwordRecoveryAttemptCookie.code_validated) {
        const result = await authService.validatePasswordRecoveryAttempt({ code: attempt });
        if (result.error || result.data === null) {
            redirect('/auth/password-recovery');
        }
        const expiresAt = new Date(result.data.expires_at);
        if (expiresAt < new Date()) {
            redirect('/auth/password-recovery');
        }
        _passwordRecoveryAttemptCookie = result.data

    }

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

                    <PasswordUpdateForm passwordAttempt={_passwordRecoveryAttemptCookie} />

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
