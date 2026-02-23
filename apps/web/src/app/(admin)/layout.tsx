import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { FinishSetupDialog } from "./__components/finish-setup-dialog";
import { MainNavProvider } from "@/lib/providers/main-nav.provider";
import { TopNav } from "@/lib/components/top-nav.component";
import { AdminHeader } from "@/lib/components/admin-header";
import MediaProvider from "@/modules/media/providers/media.provider";
import { UploadMediaModal } from "@/modules/media/components/upload-media-modal";
import { UserMetricsProvider } from "@/modules/users/providers/user-metrics.provider";
import { PortfolioProvider } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import { UserAccountBannedModal } from "@/modules/users/components/user-account-banned-modal";
const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect('/');
  }
  return <>
    <FinishSetupDialog user={userAuth} />
    <MainNavProvider defaultShrinked>
      <UserMetricsProvider userId={userAuth.id}>
        <MediaProvider>
          <PortfolioProvider userId={userAuth.id}>
            <UserAccountBannedModal />
            <UploadMediaModal />
            <div className="flex size-full items-center justify-between ">
              <AdminHeader />
              <main className="size-full flex flex-col items-start justify-start  ">
                <TopNav />

                <div className="max-w-[1920px] flex w-full justify-start h-full overflow-y-scroll">   {children}</div>

              </main>

            </div>
          </PortfolioProvider>
        </MediaProvider>
      </UserMetricsProvider>
    </MainNavProvider>

  </>;
};

export default AdminLayout;

