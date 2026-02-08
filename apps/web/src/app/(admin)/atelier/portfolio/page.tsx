import { userSession } from "@/modules/auth/server-actions/user-session.action";
import portfolioService from "@/modules/portfolios/portfolio.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus } from "lucide-react";

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
            <AdminPageTitle title="Portfolio">
                <Link href={'portfolio/create'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Portfolio
                </Link>
            </AdminPageTitle>
            {portfoliosResponse.data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {portfoliosResponse.data.map((portfolio) => (
                        <Link key={portfolio.id} href={`/atelier/portfolio/${portfolio.slug}`}>
                            <article 
                                className="group cursor-pointer aspect-square rounded-lg border border-border overflow-hidden relative"
                            >
                                {portfolio.thumbnail ? (
                                    <img
                                        src={portfolio.thumbnail}
                                        alt={portfolio.title}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                ) : null}
                                <div className={`absolute inset-0 ${portfolio.thumbnail ? 'bg-black/50' : 'bg-fg-2'}`} />
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <h3 className="text-sm font-semibold text-center text-white drop-shadow-md">
                                        {portfolio.title}
                                    </h3>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No portfolios found
                </div>
            )}
        </AdminPageContainer>
    )
}