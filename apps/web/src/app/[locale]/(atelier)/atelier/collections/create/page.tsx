import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AdminPageContainer,
  AdminPageTitle,
} from "@/app/[locale]/(atelier)/__components/admin-page.component";
import { ResourceLimitReached } from "@/app/[locale]/(atelier)/__components/resource-limit-reached";
import { getResourceLimitInfo } from "@/app/[locale]/(atelier)/__components/resource-limits";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { CreateOrUpdateCollection } from "../_components/create-update-collection";

export default async function CollectionCreate() {
  const t = await getTranslations("atelier.collections");
  const userAuth = await userSession();
  if (!userAuth) {
    redirect("/");
  }

  const metricsResponse = await usersService.metrics(userAuth.id);
  const limitInfo = getResourceLimitInfo(
    metricsResponse.data ?? null,
    TABLES_ENUM.COLLECTIONS,
  );
  if (limitInfo?.isAtLimit) {
    return (
      <AdminPageContainer>
        <AdminPageTitle title={t("createTitle")} />
        <ResourceLimitReached
          label={limitInfo.label}
          backHref="/atelier/collections"
          count={limitInfo.count}
          limit={limitInfo.limit}
        />
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageTitle title={t("createTitle")} />
      <CreateOrUpdateCollection />
    </AdminPageContainer>
  );
}
