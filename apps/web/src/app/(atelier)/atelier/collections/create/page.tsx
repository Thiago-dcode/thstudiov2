import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "@/app/(atelier)/__components/admin-page.component";
import { CreateOrUpdateCollection } from "../_components/create-update-collection";
import usersService from "@/modules/users/users.service";
import { getResourceLimitInfo } from "@/app/(atelier)/__components/resource-limits";
import { ResourceLimitReached } from "@/app/(atelier)/__components/resource-limit-reached";
import { TABLES_ENUM } from "@repo/common-lib/constants/enums";

export default async function CollectionCreate() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const metricsResponse = await usersService.metrics(userAuth.id);
    const limitInfo = getResourceLimitInfo(metricsResponse.data ?? null, TABLES_ENUM.COLLECTIONS);
    if (limitInfo?.isAtLimit) {
        return (
            <AdminPageContainer>
                <AdminPageTitle title="Create a collection" />
                <ResourceLimitReached label={limitInfo.label} backHref="/atelier/collections" count={limitInfo.count} limit={limitInfo.limit} />
            </AdminPageContainer>
        );
    }

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Create a collection" />
            <CreateOrUpdateCollection />
        </AdminPageContainer>
    );
}
