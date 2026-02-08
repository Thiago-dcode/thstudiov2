import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from '@/app/(admin)/__components/admin-page.component';
import { CreatePortfolio } from "../_components/create-porfolio";
import { PortfolioProvider } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export default async function PortfolioCreate() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Create a portfolio" />
            <PortfolioProvider userId={userAuth.id}>
            <CreatePortfolio/>

            </PortfolioProvider>
        </AdminPageContainer>
    );
}
