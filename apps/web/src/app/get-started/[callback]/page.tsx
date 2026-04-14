import PageComponent from "@/lib/components/page-component";
import { deleteInitiateSubscriptionCookie, getInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";
import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { ButtonSubmitFunnel, ContainerFormFunnel, FunnelProvider } from "../_components/funnel.provider";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";
import usersService from "@/modules/users/users.service";
import { cn } from "@repo/ui/lib/utils";

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

    const validCallbacks = ['success', 'failed','skip'];

    const [{ callback }, { token }, cookie] = await Promise.all([
        params,
        searchParams,
        getInitiateSubscriptionCookie(),
    ]);
    if(callback ==='skip'){
        await usersService.update(userAuth.id,{
            funnel_step:FUNNEL_LAST_STEP +1
        })
        redirect('/atelier')
    }
    if (!validCallbacks.some(vc => vc === callback) || token !== cookie?.token) {
        redirect('/get-started');
    }


    const isSuccess = callback === 'success';
    const retryable = cookie?.retryable;
    const successTitle = "Payment Successful!";
    const successSubtitle = "Your subscription has been activated. Welcome aboard!";
    const failedTitle = "Payment Failed";
    const failedSubtitle = "Something went wrong with your payment. Please try again.";
    if (!retryable) {
        await usersService.update(userAuth.id, {
            funnel_step: FUNNEL_LAST_STEP + 1
        })
    }

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
                            <PageComponent.Title
                                title={isSuccess ? successTitle : failedTitle}
                            />
                            <PageComponent.SubTitle
                                subTitle={isSuccess ? successSubtitle : failedSubtitle}
                            />
                        </div>
                    </div>
                </PageComponent.Header>
                <div className="flex flex-col gap-3 w-full">
                    {!isSuccess && cookie?.retryable ? (
                        <Button className="w-full min-h-11 font-semibold" asChild>
                            <Link href={'/get-started'}>Try again</Link>
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