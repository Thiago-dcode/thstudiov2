import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminHeader } from "@/lib/components/admin-header";
import { TopNav } from "@/lib/components/top-nav.component";
import { MainNavProvider } from "@/lib/providers/main-nav.provider";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { AlertCollectionButton } from "@/modules/collections/components/alert-collection.button";
import { CollectionProvider } from "@/modules/collections/providers/create-update-collection.provider";
import { UploadMediaModal } from "@/modules/media/components/upload-media-modal";
import MediaProvider from "@/modules/media/providers/media.provider";
import { AlertPortfolioButton } from "@/modules/portfolios/components/alert-portfolio.button";
import { PortfolioProvider } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import { AlertServiceButton } from "@/modules/services/components/alert-service.button";
import { CreateUpdateServiceProvider } from "@/modules/services/providers/create-update-service.provider";
import { UserBenefitModal } from "@/modules/user-benefit/components/user-benefit.modal";
import { UserAccountBannedModal } from "@/modules/users/components/user-account-banned-modal";
import { UserMetricsProvider } from "@/modules/users/providers/user-metrics.provider";
import { FinishSetupDialog } from "../__components/finish-setup-dialog";

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/auth/login");
  }
  return (
    <>
      <FinishSetupDialog user={userAuth} />
      <UserBenefitModal
        user={userAuth}
        subscriptionPath="/atelier/settings/subscription"
      />
      <MainNavProvider defaultShrinked>
        <UserMetricsProvider userId={userAuth.id}>
          <MediaProvider>
            <PortfolioProvider user={userAuth}>
              <CollectionProvider user={userAuth}>
                <CreateUpdateServiceProvider user={userAuth}>
                  <UserAccountBannedModal />
                  <UploadMediaModal />
                  <div className="fixed flex flex-col bottom-6 right-6 z-100 gap-2 ">
                    <AlertPortfolioButton />
                    <AlertCollectionButton />
                    <AlertServiceButton />
                  </div>
                  <div className="flex size-full items-center justify-start">
                    <AdminHeader />
                    <main className="size-full flex flex-col items-start justify-start ">
                      <TopNav username={userAuth.username} />

                      <div className="flex w-full justify-start h-full overflow-y-scroll">
                        {" "}
                        {children}
                      </div>
                    </main>
                  </div>
                </CreateUpdateServiceProvider>
              </CollectionProvider>
            </PortfolioProvider>
          </MediaProvider>
        </UserMetricsProvider>
      </MainNavProvider>
    </>
  );
};

export default AdminLayout;
