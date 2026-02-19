import { userSession } from "@/modules/auth/server-actions/user-session.action";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { redirect, notFound } from "next/navigation";

import { CreateOrUpdatePortfolio } from "../../_components/create-update-porfolio";
import { DeletePortfolioDialog } from "../../_components/delete-portfolio-dialog";
import { AdminPageContainer, AdminPageTitle } from "@/app/(admin)/__components/admin-page.component";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function PortfolioDetail({ params }: Props) {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const { slug } = await params;
    const portfolioResponse = await portfolioService.getBySlug(userAuth.id, slug);

    if (portfolioResponse.error) {
        return <div>{portfolioResponse?.error?.message || 'Something went wrong'}</div>;
    }

    if (!portfolioResponse.data) {
        notFound();
    }

    const portfolio = portfolioResponse.data;

    return (
        <AdminPageContainer>
            <AdminPageTitle title={"Edit: " + portfolio.title}>
                <DeletePortfolioDialog portfolioId={portfolio.id} portfolioTitle={portfolio.title} />
            </AdminPageTitle>
            <CreateOrUpdatePortfolio defaultPortfolio={portfolio}/>
        </AdminPageContainer>
    );
}

