import PageComponent from "@/components/page-component";
import { getInitiateSubscriptionCookie } from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";
import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { ButtonSubmitFunnel, ContainerFormFunnel, FunnelProvider } from "../_components/funnel.provider";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import Link from "next/link";

export default async function CallbackPage({
    params,
    searchParams,
  }: {
    params: Promise<{ callback: string }>;
    searchParams: Promise<{token?:string }>;
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
    // if (!validCallbacks.some(vc => vc === callback) || token !==cookie?.token) {
    //     redirect('get-started');
    // }
    
    const isSuccess = callback === 'success';

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
                        title={isSuccess ? "Payment Successful!" : "Payment Failed"} 
                    />
                    <PageComponent.SubTitle 
                        subTitle={isSuccess 
                            ? "Your subscription has been activated. Welcome aboard!" 
                            : "Something went wrong with your payment. Please try again."
                        } 
                    />
                </PageComponent.Header>
               <div className="flex flex-col items-center justify-center gap-2 w-full">
                {!isSuccess ? (
                    <Link className="text-blue-500 font-bold" href={'/get-started'}>Try again</Link>
                ) : null}
               <FunnelProvider lastStep={FUNNEL_LAST_STEP} user={userAuth} defaultCanContinue={true} >
                        <ContainerFormFunnel>
                        <ButtonSubmitFunnel text={!isSuccess? 'Continue with the free plan':"Continue"}/>
                        </ContainerFormFunnel>
                </FunnelProvider>
               </div>
            </PageComponent.Content>
        </PageComponent.Container>
    );
}