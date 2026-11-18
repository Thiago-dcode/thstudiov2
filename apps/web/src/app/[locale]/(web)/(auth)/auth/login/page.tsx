import { getTranslations } from "next-intl/server";
import { serverEnv } from "@/env/server";
import { FormPrivacyNotice } from "@/lib/components/form-privacy-notice";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { getRedirectTo } from "@/modules/auth/server-actions/redirect-to.action";
import { getRememberMe } from "@/modules/auth/server-actions/user-session.action";
import {
  AuthCard,
  AuthDivider,
  AuthFooter,
  AuthSwitchLink,
} from "../__components/auth-card";
import { LoginForm } from "../__components/login-form";
import { Oauth2Strategy } from "../__components/oauth2-strategy";

/**
 * Indexable, unlike the rest of the auth surface: "Sign in" is the page Google most often shows as
 * a sitelink under a brand result, and it answers "a11studio login" searches. It holds no private
 * content — a signed-in visitor is redirected away by the auth layout.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth.login.metadata");
  return buildStaticPageMetadata({
    path: "/auth/login",
    title: t("title"),
    description: t("description"),
    locale,
  });
}

export default async function Login() {
  const t = await getTranslations("auth.login");
  const registrationIsClosed = serverEnv.REGISTRATION_IS_CLOSED === 1;
  const [rememberMe, redirectTo] = await Promise.all([
    getRememberMe(),
    getRedirectTo(),
  ]);
  return (
    <AuthCard title={t("title")}>
      <Oauth2Strategy />
      <AuthDivider />
      <LoginForm rememberMe={rememberMe} redirectTo={redirectTo} />
      <AuthFooter>
        {/* While registration is closed the sign-up page only lets invitations through. */}
        {registrationIsClosed ? null : (
          <AuthSwitchLink
            prompt={t("noAccount")}
            label={t("signUp")}
            href="/auth/register"
          />
        )}
        {/* "Continue with Google" can create the account, so the sign-up agreement applies. */}
        <FormPrivacyNotice context="signInAgreement" className="max-w-xs" />
      </AuthFooter>
    </AuthCard>
  );
}
