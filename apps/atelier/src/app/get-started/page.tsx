import { userSession } from "@/modules/auth/server-actions/user-session.action"
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import dynamic from "next/dynamic"
import { redirect } from "next/navigation";
import { FunnelProvider } from "./_components/funnelProvider";

const LAST_STEP = 2;
export default async function GetStarted() {
    const user = await userSession();
    if (!user || user.funnel_step <= 0 || user.funnel_step > LAST_STEP) {
        redirect('/');
    }
    const Step = dynamic(() => import('./_components/step' + user.funnel_step), {
        loading: () => <Spinner className="size-12" />,
        
    });


    return <FunnelProvider user={user}><Step /></FunnelProvider>

}