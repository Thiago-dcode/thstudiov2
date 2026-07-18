import { MailOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import authComponent from "@/lib/components/page-component";
import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { ExpiresIn } from "../../__components/expiresIn";
import { TryAgainButton } from "../__components/tryAgainButton";
import { getTimeTillNextRecovery } from "../__utils/utils";

export default async function PasswordRecoverySuccess() {
  const passwordRecoveryAttemptCookie =
    await getPasswordRecoveryAttemptCookie();
  if (!passwordRecoveryAttemptCookie) {
    await redirect("/auth/password-recovery");
    return;
  }
  const expiresAt = new Date(passwordRecoveryAttemptCookie.expires_at);
  if (expiresAt < new Date() || passwordRecoveryAttemptCookie.code_validated) {
    await redirect("/auth/password-recovery");
    return;
  }

  return (
    <authComponent.Container className="max-w-md">
      <authComponent.Content>
        {/* Header */}
        <authComponent.Header>
          <MailOpen className="size-10" />
          <authComponent.Title title="Check your Email" />
          <authComponent.SubTitle subTitle=" We've sent a password recovery link to your email address" />
        </authComponent.Header>

        <div className="w-full flex flex-col items-center gap-2">
          <p>Didn't recieve the email?</p>
          <TryAgainButton
            nextAttempt={getTimeTillNextRecovery(passwordRecoveryAttemptCookie)}
          />
        </div>

        {/* Actions */}

        <Link
          href="/auth/login"
          className="block text-center text-text-muted hover:text-text text-sm"
        >
          Remember password?
        </Link>
      </authComponent.Content>

      <authComponent.Footer>
        <ExpiresIn
          redirect="/auth/password-recovery"
          expiresIn={expiresAt.getTime() - Date.now()}
        />
      </authComponent.Footer>
    </authComponent.Container>
  );
}
