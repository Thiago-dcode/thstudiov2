import { userSession } from "@/modules/auth/server-actions/user-session.action";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { redirect, notFound } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "../../../__components/admin-page.component";

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
            <AdminPageTitle title={portfolio.title} />
            <div className="mt-4">
                {portfolio.thumbnail && (
                    <img
                        src={portfolio.thumbnail}
                        alt={portfolio.title}
                        className="w-full max-w-md rounded-lg"
                    />
                )}
                {portfolio.description && (
                    <p className="mt-4 text-muted-foreground">{portfolio.description}</p>
                )}
            </div>
        </AdminPageContainer>
    );
}

