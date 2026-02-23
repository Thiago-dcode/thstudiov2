'use client'

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getCustomerSubscriptionPortalAction } from "@/modules/plan-subscriptions/server-actions/get-customer-subscription-portal.action";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useRouter } from "next/navigation";

type Props = {
    returnUrl: string;
};

export const LoadCustomerSubscriptionPortal = ({ returnUrl }: Props) => {
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
            onClick={() => handleAction()}
            disabled={isPending}
            className="text-xs text-text-muted hover:text-text cursor-pointer transition-colors disabled:cursor-not-allowed"
        >
            {isPending ? (
                <span className="inline-flex items-center gap-1.5">
                    <Spinner className="size-3" /> Loading…
                </span>
            ) : (
                "Manage your subscription"
            )}
        </button>
    );
};
