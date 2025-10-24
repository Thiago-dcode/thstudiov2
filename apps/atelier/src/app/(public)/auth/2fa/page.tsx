import { get2faCookieData } from "@/modules/auth/server-actions/twofa.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TwoFaForm } from "../__components/twoFaForm";
import AuthComponent from "../__components/authComponent";
import { ExpiresIn } from "../__components/expiresIn";
import { MailOpen } from "lucide-react";

export default async function TwoFactorAuth() {
  const baseUser = await get2faCookieData();
  if (!baseUser || !baseUser?.email) {
    redirect('/auth/login')
  }

  // Mask email for privacy (show first 2 chars and domain)
  const maskedEmail = baseUser.email.replace(/(.{2})(.*)(@.*)/, (_, start, middle, domain) =>
    start + '*'.repeat(Math.min(middle.length, 8)) + domain
  );
  const expiresIn = () => {
    const expiresAt = baseUser.twofa_expires_at ? new Date(baseUser.twofa_expires_at) : null;
    if (!expiresAt) return 0;
    return expiresAt.getTime() - new Date().getTime();

  }

  return (
    <AuthComponent.Container>
      {/* Header */}

      <AuthComponent.Content>
        <AuthComponent.Header>
        {/* <MailOpen className="size-10" /> */}
          <AuthComponent.Title title="Auth code validation" />
          <AuthComponent.SubTitle >
            <p className="text-sm">
              We've sent a verification code to{' '}
              <span className="font-medium">{maskedEmail}</span>
            </p>
          </AuthComponent.SubTitle >
        </AuthComponent.Header>
        <TwoFaForm baseUser={baseUser} />

        {/* Footer Links */}
        <div className="pt-4 ">
          <p className="text-sm  text-text-muted">
            Having trouble?{' '}
            <Link
              href="/auth/login"
              className=" transition-colors text-text"
            >
              Back to login
            </Link>
          </p>
        </div>
      </AuthComponent.Content>

      <AuthComponent.Footer>
        <ExpiresIn redirect='/auth/login' expiresIn={expiresIn()} />
      </AuthComponent.Footer>
    </AuthComponent.Container>


  );
}