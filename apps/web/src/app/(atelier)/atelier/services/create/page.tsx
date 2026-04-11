import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "@/app/(atelier)/__components/admin-page.component";
import { CreateOrUpdateService } from "../_components/create-update-service.component";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";

export default async function ServiceCreate() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const portfolios = await userPortfolioService.getAllByUsername(userAuth.username);

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Create a service" />
            <CreateOrUpdateService userAuth={userAuth} portfolios={portfolios?.data || []} />
        </AdminPageContainer>
    );
}
