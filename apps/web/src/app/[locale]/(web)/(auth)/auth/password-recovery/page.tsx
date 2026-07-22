import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import PageComponent from "@/lib/components/page-component";
import { getPasswordRecoveryAttemptCookie } from "@/modules/auth/server-actions/password-recovery.action";
import { PasswordRecoveryForm } from "../__components/PasswordRecovery-form";
import { getTimeTillNextRecovery } from "./__utils/utils";

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
            className="text-blue-500 hover:text-blue-600 underline"
          >
            {t("contactSupport")}
          </Link>
        </p>
      </authComponent.Footer>
    </authComponent.Container>
  );
}
