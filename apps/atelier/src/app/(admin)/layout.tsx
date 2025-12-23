import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { FinishSetupDialog } from "./__components/finish-setup-dialog";
import { MainNavProvider } from "@/lib/providers/main-nav.provider";
import { TopNav } from "@/lib/components/top-nav.component";
import { AdminHeader } from "@/lib/components/admin-header";
const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect('/');
  }
  return <>
    <FinishSetupDialog user={userAuth} />
    <MainNavProvider>
      <div className="flex size-full items-center justify-between ">
        <AdminHeader />
        <main className="size-full flex flex-col items-start justify-start  ">
          <TopNav />

          <>
            {children}</>

        </main>

      </div>
    </MainNavProvider>

  </>;
};

export default AdminLayout;

