import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import PageComponent from "@/lib/components/page-component";
import authService from "@/modules/auth/auth.service";
import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { ExpiresIn } from "../../__components/expiresIn";
import { PasswordUpdateForm } from "../../__components/passwordUpdate-form";

export default async function PasswordRecoveryRecover({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const t = await getTranslations("auth.passwordRecovery");
  const [{ attempt }, passwordRecoveryAttemptCookie] = await Promise.all([
    searchParams,
    getPasswordRecoveryAttemptCookie(),
  ]);
  let _passwordRecoveryAttemptCookie = passwordRecoveryAttemptCookie;
  let expiresAt: Date | null = null;
  if (!attempt) {
    await redirect("/auth/password-recovery");
    return;
  }
  //If there is no cookie, it means that the user open the link in another browser.
  if (_passwordRecoveryAttemptCookie) {
    expiresAt = new Date(_passwordRecoveryAttemptCookie.expires_at);
    if (expiresAt < new Date()) {
      await redirect("/auth/password-recovery");
      return;
    }
  }
  //TODO: validate the attempt
  if (!_passwordRecoveryAttemptCookie?.code_validated) {
    const result = await authService.validatePasswordRecoveryAttempt({
      code: attempt,
    });
    if (result.error || result.data === null) {
      await redirect("/auth/password-recovery");
      return;
    }
    expiresAt = new Date(result.data.expires_at);
    if (expiresAt < new Date()) {
      await redirect("/auth/password-recovery");
      return;
    }
    _passwordRecoveryAttemptCookie = result.data;
  }

  if (!_passwordRecoveryAttemptCookie) {
    await redirect("/auth/password-recovery");
    return;
  }

  return (
    <PageComponent.Container>
      <PageComponent.Content>
        <PageComponent.Header>
          <Lock className="size-10" />
          <PageComponent.Title title={t("setNewPasswordTitle")} />
          <PageComponent.SubTitle subTitle={t("setNewPasswordSubtitle")} />
        </PageComponent.Header>

        <PasswordUpdateForm passwordAttempt={_passwordRecoveryAttemptCookie} />

        <div className="relative flex justify-center text-sm">
          <p className="px-2 text-text-muted">{t("changedYourMind")}</p>
          <Link href="/auth/login">{t("backToSignIn")}</Link>
        </div>
      </PageComponent.Content>

      <PageComponent.Footer>
        {/* Timer Warning */}
        {expiresAt && (
          <ExpiresIn
            expiresIn={expiresAt.getTime() - Date.now()}
            redirect="/auth/password-recovery"
          />
        )}
      </PageComponent.Footer>
    </PageComponent.Container>
  );
}
