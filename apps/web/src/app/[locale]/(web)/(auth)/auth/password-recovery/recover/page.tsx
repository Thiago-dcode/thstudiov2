import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import PageComponent from "@/lib/components/page-component";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";
import authService from "@/modules/auth/auth.service";
import { ExpiresIn } from "../../__components/expiresIn";
import { PasswordUpdateForm } from "../../__components/passwordUpdate-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.passwordRecovery.metadataReset");
  return buildPrivatePageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function PasswordRecoveryRecover({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const t = await getTranslations("auth.passwordRecovery");
  const { attempt } = await searchParams;
  if (!attempt) {
    await redirect("/auth/password-recovery");
    return;
  }
  // The code only ever arrives through the emailed link (`attempt`), so it is always
  // checked against the API here; the recovery cookie holds timing, never the code.
  const result = await authService.validatePasswordRecoveryAttempt({
    code: attempt,
  });
  if (result.error || result.data === null) {
    await redirect("/auth/password-recovery");
    return;
  }
  const passwordRecoveryAttempt = result.data;
  const expiresAt = new Date(passwordRecoveryAttempt.expires_at);
  if (expiresAt < new Date()) {
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

        <PasswordUpdateForm passwordAttempt={passwordRecoveryAttempt} />

        <div className="relative flex justify-center text-sm">
          <p className="px-2 text-text-muted">{t("changedYourMind")}</p>
          <Link href="/auth/login">{t("backToSignIn")}</Link>
        </div>
      </PageComponent.Content>

      <PageComponent.Footer>
        {/* Timer Warning */}
        <ExpiresIn
          expiresIn={expiresAt.getTime() - Date.now()}
          redirect="/auth/password-recovery"
        />
      </PageComponent.Footer>
    </PageComponent.Container>
  );
}
