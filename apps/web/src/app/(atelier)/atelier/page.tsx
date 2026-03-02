import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserMetrics, UserMetricsSkeleton } from "../__components/user-metrics";

export default async function AtelierPage() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    return (
        <div className="size-full flex flex-col items-start justify-start gap-10 p-4">
            <div className="border-b border-b-fg-2 pb-10 w-full">
                <Suspense fallback={<UserMetricsSkeleton />}>
                    <UserMetrics userId={userAuth.id} />
                </Suspense>
            </div>
        </div>
    )
}
