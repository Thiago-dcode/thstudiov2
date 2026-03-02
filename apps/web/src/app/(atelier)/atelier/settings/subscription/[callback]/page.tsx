import PageComponent from "@/lib/components/page-component";
import { deleteInitiateSubscriptionCookie, getInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";
import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";

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
    const message = cookie?.message;

    const title = isSuccess ? "Payment Successful!" : "Payment Failed";
    const subtitle = isSuccess
        ? (message || "Your subscription has been updated. You're all set!")
        : (message || "Something went wrong with your payment. Please try again.");


    return (
        <PageComponent.Container className="h-screen flex items-center justify-center m-auto">
            <PageComponent.Content className="self-center">
                <PageComponent.Header>
                    {isSuccess ? (
                        <CheckCircle2 className="size-16 text-green-500" />
                    ) : (
                        <XCircle className="size-16 text-red-500" />
                    )}
                    <PageComponent.Title title={title} />
                    <PageComponent.SubTitle subTitle={subtitle} />
                </PageComponent.Header>
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                    {!isSuccess && cookie?.retryable && (
                        <Button className="w-full" asChild>
                            <Link className="font-semibold" href={SUBSCRIPTION_URL}>Try again</Link>
                        </Button>
                    )}
                    <Button variant={isSuccess ? "default" : "ghost"} className="w-full" asChild>
                        <Link href={SETTINGS_URL}>
                            {isSuccess ? "Back to Settings" : "Cancel"}
                        </Link>
                    </Button>
                </div>
            </PageComponent.Content>
        </PageComponent.Container>
    );
}
