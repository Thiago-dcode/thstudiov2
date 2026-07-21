import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "@/app/[locale]/(atelier)/__components/admin-page.component";
import { ResourceLimitReached } from "@/app/[locale]/(atelier)/__components/resource-limit-reached";
import { getResourceLimitInfo } from "@/app/[locale]/(atelier)/__components/resource-limits";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { CreateOrUpdatePortfolio } from "../_components/create-update-porfolio";

export default async function PortfolioCreate() {
  const t = await getTranslations("atelier.portfolios");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const metricsResponse = await usersService.metrics(userAuth.id);
  const limitInfo = getResourceLimitInfo(
    metricsResponse.data ?? null,
    TABLES_ENUM.PORTFOLIOS,
  );
  if (limitInfo?.isAtLimit) {
    return (
      <AdminPageContainer>
        <AdminPageTitle title={t("createTitle")} />
        <ResourceLimitReached
          label={limitInfo.label}
          backHref="/atelier/portfolios"
          count={limitInfo.count}
          limit={limitInfo.limit}
        />
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("createTitle")} />
      <CreateOrUpdatePortfolio />
    </AdminPageContainer>
  );
}
