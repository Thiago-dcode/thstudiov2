import { userSession } from "@/modules/auth/server-actions/user-session.action";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageContainer, AdminPageTitle, AdminPageEmptyState } from "../../__components/admin-page.component";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus, LayoutDashboard } from "lucide-react";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";

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
                <Button asChild variant="primary" size="sm">
                    <Link href={'portfolio/create'}>
                        <Plus className="size-4" />
                        Create Portfolio
                    </Link>
                </Button>
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
                    <Button asChild variant="outline" size="sm">
                        <Link href={'portfolio/create'}>
                            <Plus className="size-4 mr-2" />
                            Create Portfolio
                        </Link>
                    </Button>
                </AdminPageEmptyState>
            )}
        </AdminPageContainer>
    )
}