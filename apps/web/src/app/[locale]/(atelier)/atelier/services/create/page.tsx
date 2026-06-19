import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { redirect } from "next/navigation";
import {
 AdminPageContainer,
 AdminPageTitle,
} from "@/app/[locale]/(atelier)/__components/admin-page.component";
import { ResourceLimitReached } from "@/app/[locale]/(atelier)/__components/resource-limit-reached";
import { getResourceLimitInfo } from "@/app/[locale]/(atelier)/__components/resource-limits";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";
import { CreateOrUpdateService } from "../_components/create-update-service.component";

export default async function ServiceCreate() {
 const userAuth = await userSession();
 if (!userAuth) {
 redirect("/");
 }

 const [portfolios, metricsResponse] = await Promise.all([
 userPortfolioService.getAllByUsername(userAuth.username),
 usersService.metrics(userAuth.id),
 ]);

 const limitInfo = getResourceLimitInfo(
 metricsResponse.data ?? null,
 TABLES_ENUM.SERVICES,
 );
 if (limitInfo?.isAtLimit) {
 return (
 <AdminPageContainer>
 <AdminPageTitle title="Create a service" />
 <ResourceLimitReached
 label={limitInfo.label}
 backHref="/atelier/services"
 count={limitInfo.count}
 limit={limitInfo.limit}
 />
 </AdminPageContainer>
 );
 }

 return (
 <AdminPageContainer>
 <AdminPageTitle title="Create a service" />
 <CreateOrUpdateService
 userAuth={userAuth}
 portfolios={portfolios?.data || []}
 />
 </AdminPageContainer>
 );
}
