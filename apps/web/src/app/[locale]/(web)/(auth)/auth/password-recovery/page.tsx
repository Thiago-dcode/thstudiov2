import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import PageComponent from "@/lib/components/page-component";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";
import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { PasswordRecoveryForm } from "../__components/PasswordRecovery-form";
import { getTimeTillNextRecovery } from "./__utils/utils";

export async function generateMetadata() {
  const t = await getTranslations("auth.passwordRecovery.metadata");
  return buildPrivatePageMetadata({
    title: t("title"),
    description: t("description"),
    follow: true,
  });
}

const authComponent = PageComponent;
export default async function PasswordRecovery() {
  const t = await getTranslations("auth.passwordRecovery");
  const timeTillNextRecovery = getTimeTillNextRecovery(
    await getPasswordRecoveryAttemptCookie(),
  );
  if (timeTillNextRecovery > 0) {
    await redirect("/auth/password-recovery/success");
    return;
  }
  return (
    <authComponent.Container>
      <authComponent.Content>
        <authComponent.Header>
          {" "}
          {/* Header */}
          <PageComponent.Title title={t("title")} />
          <PageComponent.SubTitle subTitle={t("subtitle")} />
        </authComponent.Header>
        <PasswordRecoveryForm />

        {/* Divider */}

        <Link
          className="text-sm transition-colors text-text-muted hover:text-text "
          href={"/auth/login"}
        >
          {t("rememberPassword")}
        </Link>
      </authComponent.Content>
      <authComponent.Footer>
        <p>
          {t("needHelp")}{" "}
          <Link
            href="/support"
            className="text-text underline decoration-border-em underline-offset-4 transition-colors hover:decoration-text"
          >
            {t("contactSupport")}
          </Link>
        </p>
      </authComponent.Footer>
    </authComponent.Container>
  );
}
