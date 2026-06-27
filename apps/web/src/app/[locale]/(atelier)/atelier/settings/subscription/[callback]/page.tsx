import { Button } from "@repo/ui/components/shadcn/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { CallbackSubscriptionPage } from "@/modules/plan-subscriptions/components/callback-subscription-page";
import { getInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";

const SETTINGS_URL = "/atelier/settings";
const SUBSCRIPTION_URL = "/atelier/settings/subscription";

export default async function SubscriptionCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ callback: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const validCallbacks = ["success", "failed"];

  const [{ callback }, { token }, cookie] = await Promise.all([
    params,
    searchParams,
    getInitiateSubscriptionCookie(),
  ]);

  if (!cookie || !validCallbacks.includes(callback) || token !== cookie.token) {
    redirect(SETTINGS_URL);
  }

  const t = await getTranslations("subscriptionCallback");
  const isSuccess = callback === "success";
  const title = isSuccess ? t("success.title") : t("failed.title");
  const subtitle = isSuccess ? t("success.subtitle") : t("failed.subtitle");

  return (
    <CallbackSubscriptionPage
      isSuccess={isSuccess}
      title={title}
      subtitle={subtitle}
      className="h-full"
    >
      {!isSuccess && cookie?.retryable && (
        <Button
          className="w-full min-h-12 font-medium tracking-wide uppercase text-xs"
          asChild
        >
          <Link href={SUBSCRIPTION_URL}>{t("tryAgain")}</Link>
        </Button>
      )}
      <Button
        variant={isSuccess ? "default" : "outline"}
        className="w-full min-h-12 font-medium tracking-wide uppercase text-xs"
        asChild
      >
        <Link href={SETTINGS_URL}>
          {isSuccess ? t("continue") : t("cancel")}
        </Link>
      </Button>
    </CallbackSubscriptionPage>
  );
}
