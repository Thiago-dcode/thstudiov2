import { get2faCookieData } from "@/modules/auth/server-actions/twofa.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import zod from "zod";
import { TwoFaForm } from "../__components/twoFaForm";

export default async function TwoFactorAuth() {
  const email = await get2faCookieData();
  const validatedEmail = zod.email().safeParse(email);
  if (!email || !validatedEmail.success) {
    redirect('/auth/login');
  }

  // Mask email for privacy (show first 2 chars and domain)
  const maskedEmail = validatedEmail.data.replace(/(.{2})(.*)(@.*)/, (_, start, middle, domain) =>
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

          <TwoFaForm email={email} />

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