import PasswordRecoveryAction from "@/modules/auth/server-actions/password-recovery.action";
import Link from "next/link";

export default async function PasswordRecovery({ searchParams }: { searchParams: Promise<{ "errors[]"?: string[] | string, email?: string, success?: string }> }) {
    const { "errors[]": _errors, email, success } = await searchParams;
    const errors: string[] = typeof _errors === 'string' ? [_errors] : _errors || [];
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Password Recovery
                        </h1>
                        <p className="text-sm text-slate-600">
                            Enter your email and we'll send you a recovery link
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-800 mb-1">Email sent!</p>
                            <p className="text-sm text-green-700">
                                Check your inbox for password recovery instructions.
                            </p>
                        </div>
                    )}

                    {/* Error Messages */}
                    {errors && errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-red-800 mb-1">Request failed</p>
                            <ul className="text-sm text-red-700 space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-5" action={PasswordRecoveryAction}>
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                defaultValue={email}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                autoFocus
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Send Recovery Link
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">
                                Remember your password?
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
    );
}