import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import PlanSubscriptionList from "@/modules/plans/components/plan-list";
import plansService from "@/modules/plans/plans.service";
import userBenefitService from "@/modules/user-benefit/user-benefit.service";
import usersService from "@/modules/users/users.service";
import utilsService from "@/modules/utils/utils.service";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "../../../__components/admin-page.component";

// This page is only for upgrade plans, downgrade or cancel should be handled by stripe portal
export default async function UpdateSubscriptionPage() {
  const user = await userSession();
  if (!user) redirect("/");

  const [plans, activePlan, paymentMethods, benefit] = await Promise.all([
    plansService.getAll({ is_active: true }),
    usersService.getActivePlan(user.id),
    utilsService.getPaymentMethods({ enabled: true }),
    userBenefitService.getByUserId(user.id),
  ]);
  console.log(plans, paymentMethods);
  if (plans.error || !plans.data || !paymentMethods.data) {
    redirect("/atelier/settings");
  }

  //Only display more expensive plans, aka upgrade
  const filteredPlans = plans.data.filter(
    (p) =>
      !p.is_free &&
      (!activePlan?.data?.base_price ||
        p.base_price > activePlan?.data?.base_price),
  );

  //User already on the more expensive plan
  if (filteredPlans.length === 0) {
    const currentPlanName =
      activePlan?.data?.translation?.name ||
      activePlan?.data?.name ||
      "your current plan";
    return (
      <AdminPageContainer>
        <AdminPageTitle title="Change Plan">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/atelier/settings" className="gap-2">
              <ArrowLeft className="size-4" /> Back to Settings
            </Link>
          </Button>
        </AdminPageTitle>

        <div className="flex items-center justify-center pt-8">
          <section className="w-full max-w-lg border border-fg-2 rounded-md px-6 py-6 space-y-2">
            <p className="text-base font-semibold">
              You're already on the most powerful plan.
            </p>
            <p className="text-sm text-text-muted">
              Your current plan is{" "}
              <span className="font-medium text-text">{currentPlanName}</span> —
              there’s nothing higher to upgrade to right now.
            </p>
            <div className="pt-2">
              <Button asChild className="w-full">
                <Link href="/atelier/settings">Go back to Settings</Link>
              </Button>
            </div>
          </section>
        </div>
      </AdminPageContainer>
    );
  }

  const subscriptionBaseUrl = `${config.app_url}/atelier/settings/subscription`;

  return (
    <AdminPageContainer>
      <AdminPageTitle title="Change Plan">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/atelier/settings" className="gap-2">
            <ArrowLeft className="size-4" /> Back to Settings
          </Link>
        </Button>
      </AdminPageTitle>

      <div className="flex items-center justify-center pt-8">
        <PlanSubscriptionList
          plans={filteredPlans}
          paymentMethods={paymentMethods.data}
          successUrl={`${subscriptionBaseUrl}/success`}
          cancelUrl={`${subscriptionBaseUrl}/failed`}
          benefit={benefit.data || undefined}
          onFreeComponent={
            <Button variant="outline" asChild className="w-full">
              <Link href="/atelier/settings">Cancel</Link>
            </Button>
          }
          onErrorComponent={
            <Button variant="outline" asChild className="w-full">
              <Link href="/atelier/settings">Back to Settings</Link>
            </Button>
          }
        />
      </div>
    </AdminPageContainer>
  );
}
