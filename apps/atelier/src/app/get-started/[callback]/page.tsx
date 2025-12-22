import PageComponent from "@/components/page-component";
import { deleteInitiateSubscriptionCookie, getInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";
import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { ButtonSubmitFunnel, ContainerFormFunnel, FunnelProvider } from "../_components/funnel.provider";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import usersService from "@/modules/users/users.service";

export default async function CallbackPage({
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
    if (!validCallbacks.some(vc => vc === callback) || token !== cookie?.token) {
        redirect('/get-started');
    }

    const isSuccess = callback === 'success';
    const retryable = cookie?.retryable;
    const message = cookie?.message;
    const successTitle = "Payment Successful!";
    const successSubtitle = message || "Your subscription has been activated. Welcome aboard!";
    const failedTitle = "Payment Failed";
    const failedSubtitle = message || "Something went wrong with your payment. Please try again.";
    console.log("COOKIE CALLBACK",cookie)
    if (!retryable) {
        await usersService.update(userAuth.id, {
            funnel_step: FUNNEL_LAST_STEP + 1
        })
    }

    return (
        <PageComponent.Container className="h-screen flex items-center justify-center m-auto">
            <PageComponent.Content className="self-center">
                <PageComponent.Header>
                    {isSuccess ? (
                        <CheckCircle2 className="size-16 text-green-500" />
                    ) : (
                        <XCircle className="size-16 text-red-500" />
                    )}
                    <PageComponent.Title
                        title={isSuccess ? successTitle : failedTitle}
                    />
                    <PageComponent.SubTitle
                        subTitle={isSuccess ? successSubtitle : failedSubtitle}
                    />
                </PageComponent.Header>
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                    {!isSuccess && cookie?.retryable ? (
                        <Button className="w-full" asChild>
                            <Link className="font-semibold" href={'/get-started'}>Try again</Link>
                        </Button>
                    ) : null}
                    <FunnelProvider lastStep={FUNNEL_LAST_STEP} user={userAuth} defaultCanContinue={true} >
                        <ContainerFormFunnel onSubmitCallback={deleteInitiateSubscriptionCookie}>
                            <ButtonSubmitFunnel simple={!isSuccess ? true : false} text={!isSuccess ? 'Skip for now' : "Continue"} />
                        </ContainerFormFunnel>
                    </FunnelProvider>
                </div>
            </PageComponent.Content>
        </PageComponent.Container>
    );
}