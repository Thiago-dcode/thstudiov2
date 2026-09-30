import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import authComponent from "@/lib/components/page-component";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { getRedirectTo } from "@/modules/auth/server-actions/redirect-to.action";
import { getRememberMe } from "@/modules/auth/server-actions/user-session.action";
import { LoginForm } from "../__components/login-form";

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
  const [rememberMe, redirectTo] = await Promise.all([
    getRememberMe(),
    getRedirectTo(),
  ]);
  return (
    <authComponent.Container>
      <authComponent.Content>
        <authComponent.Header>
          <authComponent.Title title={t("title")} />
          <authComponent.SubTitle subTitle={t("subtitle")} />
        </authComponent.Header>
        <LoginForm rememberMe={rememberMe} redirectTo={redirectTo} />

        <Link
          href="/auth/password-recovery"
          className="text-sm transition-colors text-text-muted hover:text-text "
        >
          {t("problemWithLogin")}
        </Link>
      </authComponent.Content>

      <authComponent.Footer>
        <div>
          {" "}
          {t("agreePrefix")}{" "}
          <div>
            <Link
              href="/legal/terms"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              {t("termsOfService")}
            </Link>{" "}
            {t("and")}{" "}
            <Link
              href="/legal/privacy"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              {t("privacyPolicy")}
            </Link>
          </div>
        </div>
      </authComponent.Footer>
    </authComponent.Container>
  );
}
