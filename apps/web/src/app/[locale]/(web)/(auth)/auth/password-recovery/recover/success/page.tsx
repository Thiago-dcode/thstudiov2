import { Button } from "@repo/ui/components/shadcn/button";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";
import PageComponent from "@/lib/components/page-component";
import { getPasswordUpdatedCookie } from "@/modules/auth/server-actions/password-update.action";

export default async function PasswordUpdateSuccess() {
  const t = await getTranslations("auth.passwordRecovery");
  const passwordUpdatedCookie = await getPasswordUpdatedCookie();
  if (!passwordUpdatedCookie) {
    await redirect("/auth/password-recovery");
    return;
  }

  return (
    <PageComponent.Container>
      <PageComponent.Content>
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
        </div>

        <PageComponent.Header>
          <PageComponent.Title title={t("successTitle")} />
          <PageComponent.SubTitle subTitle={t("successSubtitle")} />
        </PageComponent.Header>

        {/* Action Button */}
        <div className="w-full">
          <Button asChild variant="default" className="w-full py-6">
            <Link href="/auth/login">{t("continueToSignIn")}</Link>
          </Button>
        </div>
      </PageComponent.Content>

      <PageComponent.Footer>
        <p>
          {t("needHelp")}{" "}
          <Link
            href="/support"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            {t("contactSupport")}
          </Link>
        </p>
      </PageComponent.Footer>
    </PageComponent.Container>
  );
}
