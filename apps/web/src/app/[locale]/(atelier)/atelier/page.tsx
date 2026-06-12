import { redirect } from "next/navigation";
import { Suspense } from "react";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "../__components/admin-page.component";
import { UserMetrics, UserMetricsSkeleton } from "../__components/user-metrics";

export default async function AtelierPage() {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }
  return (
    <AdminPageContainer>
      <AdminPageTitle title="Dashboard" />
      <div className="border-b border-b-fg-2 pb-10 w-full">
        <Suspense fallback={<UserMetricsSkeleton />}>
          <UserMetrics userId={userAuth.id} />
        </Suspense>
      </div>
    </AdminPageContainer>
  );
}
