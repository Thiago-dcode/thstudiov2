"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getCustomerSubscriptionPortalAction } from "@/modules/plan-subscriptions/server-actions/get-customer-subscription-portal.action";

type Props = {
  returnUrl: string;
};

export const LoadCustomerSubscriptionPortal = ({ returnUrl }: Props) => {
  const t = useTranslations("plans.portal");
  const router = useRouter();

  const { handleAction, isPending } = useHandleAction({
    action: async () => {
      return await getCustomerSubscriptionPortalAction(returnUrl);
    },
    afterAction: async (result) => {
      if (result.data?.url) {
        router.push(result.data.url);
      }
    },
  });

  return (
    <button
      type="button"
      onClick={() => handleAction()}
      disabled={isPending}
      className="text-xs text-text-muted hover:text-text cursor-pointer transition-colors disabled:cursor-not-allowed"
    >
      {isPending ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner className="size-3" /> {t("loading")}
        </span>
      ) : (
        t("manageSubscription")
      )}
    </button>
  );
};
