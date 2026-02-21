import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from '@/app/(admin)/__components/admin-page.component';
import { CreateOrUpdatePortfolio } from "../_components/create-update-porfolio";

export default async function PortfolioCreate() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Create a portfolio" />
            <CreateOrUpdatePortfolio />
        </AdminPageContainer>
    );
}
