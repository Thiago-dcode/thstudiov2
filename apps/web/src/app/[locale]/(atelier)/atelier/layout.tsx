import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminHeader } from "@/lib/components/admin-header";
import { TopNav } from "@/lib/components/top-nav.component";
import { MainNavProvider } from "@/lib/providers/main-nav.provider";
import { isOnboardingPending } from "@/modules/auth/auth.utils";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { AlertCollectionButton } from "@/modules/collections/components/alert-collection.button";
import { CollectionProvider } from "@/modules/collections/providers/create-update-collection.provider";
import { UploadMediaStatusModal } from "@/modules/media/components/upload-media-status-modal";
import MediaProvider from "@/modules/media/providers/media.provider";
import { AlertPortfolioButton } from "@/modules/portfolios/components/alert-portfolio.button";
import { PortfolioProvider } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import { AlertServiceButton } from "@/modules/services/components/alert-service.button";
import { CreateUpdateServiceProvider } from "@/modules/services/providers/create-update-service.provider";
import { UserNotificationsProvider } from "@/modules/user-notifications/contexts/user-notifications.provider";
import { ProfileSetupGuide } from "@/modules/users/components/profile-setup-guide";
import { UserAccountBannedModal } from "@/modules/users/components/user-account-banned-modal";
import { OnboardingOverlaysProvider } from "@/modules/users/providers/onboarding-overlays.provider";
import { UserMetricsProvider } from "@/modules/users/providers/user-metrics.provider";
import usersService from "@/modules/users/users.service";
import { AtelierOnboardingDialogs } from "../__components/atelier-onboarding-dialogs";

/**
 * The whole atelier is the signed-in workspace — never indexable. robots.txt already disallows
 * `/atelier`, but `Disallow` alone does not stop Google indexing a URL it finds linked, so the
 * directive is declared here too. Inherited by all 16 atelier routes, including the payment
 * callbacks under `settings/subscription/[callback]`.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/auth/login");
  }
  // The session cookie's funnel_step is a snapshot. Some paths finish onboarding on the server
  // (Stripe callback "skip", the plan step) without rewriting the cookie, so a cookie that still
  // says "pending" is checked against the database before nagging with "finish setup". The step
  // only moves forward outside the funnel, so a cookie saying "done" never needs the check.
  let funnelStep = userAuth.funnel_step;
  if (isOnboardingPending(funnelStep)) {
    const fresh = await usersService.getOne(userAuth.id);
    if (fresh.data) funnelStep = fresh.data.funnel_step;
  }
  return (
    <OnboardingOverlaysProvider>
      <AtelierOnboardingDialogs
        user={{ ...userAuth, funnel_step: funnelStep }}
        subscriptionPath="/atelier/settings/subscription"
      />
      <MainNavProvider defaultShrinked>
        <UserMetricsProvider userId={userAuth.id}>
          <UserNotificationsProvider>
            <MediaProvider>
              <PortfolioProvider user={userAuth}>
                <CollectionProvider user={userAuth}>
                  <CreateUpdateServiceProvider user={userAuth}>
                    <UserAccountBannedModal />
                    <div className="fixed flex flex-col items-end bottom-6 right-6 z-100 gap-2 ">
                      <ProfileSetupGuide />
                      <UploadMediaStatusModal />
                      <AlertPortfolioButton />
                      <AlertCollectionButton />
                      <AlertServiceButton />
                    </div>
                    <div className="flex size-full items-center justify-start">
                      <AdminHeader />
                      <main className="size-full flex flex-col items-start justify-start ">
                        <TopNav username={userAuth.username} />
                        <div className="relative flex w-full min-h-0 flex-1 justify-start overflow-y-auto">
                          {" "}
                          {children}
                        </div>
                      </main>
                    </div>
                  </CreateUpdateServiceProvider>
                </CollectionProvider>
              </PortfolioProvider>
            </MediaProvider>
          </UserNotificationsProvider>
        </UserMetricsProvider>
      </MainNavProvider>
    </OnboardingOverlaysProvider>
  );
};

export default AdminLayout;
