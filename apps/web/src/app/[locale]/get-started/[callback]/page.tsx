import { FUNNEL_LAST_STEP } from "@repo/common-lib/constants/constants";
import { Button } from "@repo/ui/components/shadcn/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { CallbackSubscriptionPage } from "@/modules/plan-subscriptions/components/callback-subscription-page";
import {
 deleteInitiateSubscriptionCookie,
 getInitiateSubscriptionCookie,
} from "@/modules/plan-subscriptions/server-actions/initiate-subscription.action";
import usersService from "@/modules/users/users.service";
import {
 ButtonSubmitFunnel,
 ContainerFormFunnel,
 FunnelProvider,
} from "../_components/funnel.provider";

export default async function CallbackPage({
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

 const validCallbacks = ["success", "failed", "skip"];

 const [{ callback }, { token }, cookie] = await Promise.all([
 params,
 searchParams,
 getInitiateSubscriptionCookie(),
 ]);
 if (callback === "skip") {
 await usersService.update(userAuth.id, {
 funnel_step: FUNNEL_LAST_STEP + 1,
 });
 redirect("/atelier");
 }
 if (
 !cookie ||
 !validCallbacks.some((vc) => vc === callback) ||
 token !== cookie.token
 ) {
 redirect("/get-started");
 }

 const isSuccess = callback === "success";
 const retryable = cookie?.retryable;
 const title = isSuccess ? "Activation complete." : "Activation incomplete.";
 const subtitle = isSuccess
 ? "Your subscription is now active."
 : "We were unable to activate your subscription. Please try again.";

 if (!retryable) {
 await usersService.update(userAuth.id, {
 funnel_step: FUNNEL_LAST_STEP + 1,
 });
 }

 return (
 <CallbackSubscriptionPage
 isSuccess={isSuccess}
 title={title}
 subtitle={subtitle}
 className="h-screen"
 >
 {!isSuccess && cookie?.retryable ? (
 <Button
 className="w-full min-h-12 font-medium tracking-wide uppercase text-xs"
 asChild
 >
 <Link href={"/get-started"}>Try again</Link>
 </Button>
 ) : null}
 <FunnelProvider
 lastStep={FUNNEL_LAST_STEP}
 user={userAuth}
 defaultCanContinue={true}
 >
 <ContainerFormFunnel
 onSubmitCallback={deleteInitiateSubscriptionCookie}
 >
 <ButtonSubmitFunnel
 simple={!isSuccess}
 text={!isSuccess ? "Skip for now" : "Continue"}
 />
 </ContainerFormFunnel>
 </FunnelProvider>
 </CallbackSubscriptionPage>
 );
}
