import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { UserMetrics } from "../__components/user-metrics";
import { Suspense } from "react";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    return (
        <div className="size-full flex flex-col items-center justify-start">
            <Suspense fallback={<Spinner />}>  <UserMetrics userId={userAuth.id} /></Suspense>
        </div>
    )
}