import { userSession } from "@/modules/auth/server-actions/user-session.action";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle, AdminPageEmptyState } from "../../__components/admin-page.component";
import { LayoutDashboard } from "lucide-react";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import { CreateResourceButton } from "../../__components/create-resource-button";
import { TABLES_ENUM } from "@repo/common-lib/constants/enums";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const portfoliosResponse = await portfolioService.findAll({
        user_id: userAuth.id
    });

    if (portfoliosResponse.error) {
        return <div>{portfoliosResponse?.error?.message || 'Something went wrong'}</div>
    }

    return (
        <AdminPageContainer>
            <AdminPageTitle
                title="Portfolio"
                info="Portfolios represent broad categories of your work, such as 'Travel Photography' or 'Wedding Photography'. They are designed to showcase your best pieces to clients and can include both individual media and collections."
            >
                <CreateResourceButton resource={TABLES_ENUM.PORTFOLIOS} href="portfolio/create" label="Create Portfolio" />
            </AdminPageTitle>
            {portfoliosResponse.data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {portfoliosResponse.data.map((portfolio) => (
                        <PortfolioCard
                            key={portfolio.id}
                            portfolio={portfolio}
                            username={userAuth.username}
                            isAtelier
                        />
                    ))}
                </div>
            ) : (
                <AdminPageEmptyState 
                    icon={<LayoutDashboard />}
                    description="No portfolios created yet. Start by grouping your work."
                >
                    <CreateResourceButton resource={TABLES_ENUM.PORTFOLIOS} href="portfolio/create" label="Create Portfolio" variant="outline" />
                </AdminPageEmptyState>
            )}
        </AdminPageContainer>
    )
}