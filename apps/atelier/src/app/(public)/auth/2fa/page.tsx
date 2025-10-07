import { get2faCookieData, verify2faServerAction } from "@/modules/auth/server-actions/twofa.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import zod from "zod";

export default async function TwoFactorAuth({ searchParams }: { searchParams: Promise<{ "errors[]"?: string[] }> }) {
  const { "errors[]": errors } = await searchParams;
  const email = await get2faCookieData();
  if (!email) {
    redirect('/auth/login');
  }
  const validatedEmail = zod.email().safeParse(email);
  if (!validatedEmail.success) {
    redirect('/auth/login?errors[]=Invalid session');
  }
  // Mask email for privacy (show first 2 chars and domain)
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, start, middle, domain) =>
    start + '*'.repeat(Math.min(middle.length, 8)) + domain
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Two-Factor Authentication
            </h1>
            <p className="text-sm text-slate-600">
              We've sent a verification code to{' '}
              <span className="font-medium text-slate-900">{maskedEmail}</span>
            </p>
          </div>

          {/* Error Messages */}
          {errors && errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-1">Verification failed</p>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form */}
          <form action={verify2faServerAction} className="space-y-6">
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

          {/* Footer Links */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Having trouble?{' '}
              <Link 
                href="/auth/login" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Back to login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          This code expires after a short period. If it doesn't work, please try logging in again.
        </p>
      </div>
    </div>
  );
}