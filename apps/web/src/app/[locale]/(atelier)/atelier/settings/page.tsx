import { InfoTooltip } from "@repo/ui/components/custom/info-tooltip";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  KeyRound,
  Mail,
  RefreshCw,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { LoadCustomerSubscriptionPortal } from "@/modules/plans/components/load-customer-subscription-portal";
import usersService from "@/modules/users/users.service";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "../../__components/admin-page.component";
import { EditUserPasswordDialog } from "./_components/edit-user-password.dialog";
import { EditUserUsernameDialog } from "./_components/edit-user-username.dialog";

export default async function SettingsPage() {
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const [userResponse, activeSubscriptionResponse] = await Promise.all([
    usersService.getOne(userAuth.id),
    usersService.getActiveSubscription(userAuth.id),
  ]);

  if (!userResponse.data) {
    redirect("/");
  }

  const user = userResponse.data;
  const activeSubscription = activeSubscriptionResponse.data ?? null;
  const isFree = activeSubscription?.plan_price.plan.is_free ?? true;
  const isTrialing = activeSubscription?.is_trialing ?? false;
  const planName = activeSubscription?.plan_price.plan.name ?? "Free";

  const nextBillingDate = activeSubscription?.next_billing_date
    ? new Date(
        activeSubscription.next_billing_date as unknown as string,
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const cancelAtFormatted = activeSubscription?.cancel_at
    ? new Date(
        activeSubscription.cancel_at as unknown as string,
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <AdminPageContainer>
      <AdminPageTitle title="Settings" />

      <div className="flex flex-col gap-4 max-w-lg">
        {/* Account info */}
        <section className="border border-fg-2 divide-y divide-fg-2">
          <div className="px-4 py-3">
            <h2 className="text-sm font-medium text-text-muted">Account</h2>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <User className="size-4 text-text-muted" />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{user.username}</p>
                  <InfoTooltip content="Your username appears in your public URL. Pick something short and memorable — you can't change it often." />
                </div>
                <p className="text-xs text-text-muted">Username</p>
              </div>
            </div>
            <EditUserUsernameDialog user={user} />
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-text-muted" />
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-text-muted">Email</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="border border-fg-2 divide-y divide-fg-2">
          <div className="px-4 py-3">
            <h2 className="text-sm font-medium text-text-muted">Security</h2>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <KeyRound className="size-4 text-text-muted" />
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-text-muted">
                  Update your account password
                </p>
              </div>
            </div>
            <EditUserPasswordDialog user={user} />
          </div>
        </section>

        {/* Subscription */}
        <section className="border border-fg-2 divide-y divide-fg-2">
          <div className="px-4 py-3">
            <h2 className="text-sm font-medium text-text-muted">
              Subscription
            </h2>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <CreditCard className="size-4 text-text-muted" />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{planName}</p>
                  {!isFree && activeSubscription && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-fg-1 text-text-muted border border-fg-2">
                      {activeSubscription.plan_price.billing_type}
                    </span>
                  )}
                  {isTrialing && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Sparkles className="size-2.5" />
                      Trial
                    </span>
                  )}
                </div>
                {isTrialing && nextBillingDate ? (
                  <p className="text-xs text-amber-500">
                    Free trial ends {nextBillingDate}
                  </p>
                ) : !isFree && activeSubscription ? (
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    {activeSubscription.auto_renewal ? (
                      <>
                        {nextBillingDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            Renews {nextBillingDate}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <RefreshCw className="size-3" />€
                          {activeSubscription.amount.toFixed(2)}
                        </span>
                      </>
                    ) : cancelAtFormatted ? (
                      <span className="flex items-center gap-1 text-amber-500">
                        <XCircle className="size-3" />
                        Cancels {cancelAtFormatted}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">
                    You are on the free plan
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/atelier/settings/subscription" className="gap-1.5">
                  {isFree ? "Upgrade" : "Change"}{" "}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              {!isFree && (
                <LoadCustomerSubscriptionPortal
                  returnUrl={`${config.app_url}/atelier/settings`}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminPageContainer>
  );
}
