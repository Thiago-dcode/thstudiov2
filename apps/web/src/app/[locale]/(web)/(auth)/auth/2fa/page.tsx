import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import PageComponent from "@/lib/components/page-component";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";
import { getRedirectTo } from "@/modules/auth/server-actions/redirect-to.action";
import { get2faCookieData } from "@/modules/auth/server-actions/twofa.action";
import { ExpiresIn } from "../__components/expiresIn";
import { TwoFaForm } from "../__components/twoFa-form";

export async function generateMetadata() {
  const t = await getTranslations("auth.twoFa.metadata");
  return buildPrivatePageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function TwoFactorAuth() {
  const t = await getTranslations("auth.twoFa");
  const [user, redirectTo] = await Promise.all([
    get2faCookieData(),
    getRedirectTo(),
  ]);
  if (!user?.email) {
    await redirect("/auth/login");
    return;
  }

  // Mask email for privacy (works for 1-char local parts too)
  const maskEmail = (email: string) => {
    const at = email.indexOf("@");
    if (at <= 0) return email;
    const local = email.slice(0, at);
    const domain = email.slice(at);
    if (local.length <= 1) {
      return `${local}*${domain}`;
    }
    return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 8))}${domain}`;
  };
  const maskedEmail = maskEmail(user.email);
  const expiresIn = () => {
    const expiresAt = user.twofa_expires_at
      ? new Date(user.twofa_expires_at)
      : null;
    if (!expiresAt) return 0;
    return expiresAt.getTime() - Date.now();
  };

  //TODO: handle is new register
  return (
    <PageComponent.Container>
      {/* Header */}

      <PageComponent.Content>
        <PageComponent.Header>
          {/* <MailOpen className="size-10" /> */}
          <PageComponent.Title
            title={
              user.is_new
                ? t("titleValidateEmail")
                : t("titleDeviceVerification")
            }
          />
          <PageComponent.SubTitle>
            <p className="text-sm">
              {t("codeSentTo")}{" "}
              <span className="font-medium">{maskedEmail}</span>
            </p>
          </PageComponent.SubTitle>
        </PageComponent.Header>
        <TwoFaForm user={user} redirectTo={redirectTo} />

        {/* Footer Links */}
        <div className="pt-4 ">
          <p className="text-sm text-text-muted">
            {t("havingTrouble")}{" "}
            <Link href="/auth/login" className=" transition-colors text-text">
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </PageComponent.Content>

      <PageComponent.Footer>
        <ExpiresIn redirect="/auth/login" expiresIn={expiresIn()} />
      </PageComponent.Footer>
    </PageComponent.Container>
  );
}
