import PageComponent from "@/lib/components/page-component";
import { getInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";
import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";

const SETTINGS_URL = '/atelier/settings';
const SUBSCRIPTION_URL = '/atelier/settings/subscription';

export default async function SubscriptionCallbackPage({
    params,
    searchParams,
}: {
    params: Promise<{ callback: string }>;
    searchParams: Promise<{ token?: string }>;
}) {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const validCallbacks = ['success', 'failed'];

    const [{ callback }, { token }, cookie] = await Promise.all([
        params,
        searchParams,
        getInitiateSubscriptionCookie(),
    ]);

    if (!validCallbacks.includes(callback) || token !== cookie?.token) {
        redirect(SETTINGS_URL);
    }

    const isSuccess = callback === 'success';

    const title = isSuccess ? "Payment Successful!" : "Payment Failed";
    const subtitle = isSuccess
        ? "Your subscription has been updated. You're all set!"
        : "Something went wrong with your payment. Please try again.";

    return (
        <PageComponent.Container className="h-screen flex items-center justify-center m-auto">
            <PageComponent.Content className={cn("self-center w-full max-w-md gap-10")}>
                <PageComponent.Header>
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div
                            className={cn(
                                "flex size-20 shrink-0 items-center justify-center rounded-full",
                                isSuccess
                                    ? "bg-(--color-success)/15 text-(--color-success)"
                                    : "bg-(--color-error)/15 text-(--color-error)"
                            )}
                            aria-hidden
                        >
                            {isSuccess ? (
                                <CheckCircle2 className="size-10" strokeWidth={1.75} />
                            ) : (
                                <XCircle className="size-10" strokeWidth={1.75} />
                            )}
                        </div>
                        <div className="space-y-2">
                            <PageComponent.Title title={title} />
                            <PageComponent.SubTitle subTitle={subtitle} />
                        </div>
                    </div>
                </PageComponent.Header>
                <div className="flex flex-col gap-3 w-full">
                    {!isSuccess && cookie?.retryable && (
                        <Button className="w-full min-h-11 font-semibold" asChild>
                            <Link href={SUBSCRIPTION_URL}>Try again</Link>
                        </Button>
                    )}
                    <Button
                        variant={isSuccess ? "default" : "ghost"}
                        className="w-full min-h-11"
                        asChild
                    >
                        <Link href={SETTINGS_URL}>
                            {isSuccess ? "Back to Settings" : "Cancel"}
                        </Link>
                    </Button>
                </div>
            </PageComponent.Content>
        </PageComponent.Container>
    );
}
