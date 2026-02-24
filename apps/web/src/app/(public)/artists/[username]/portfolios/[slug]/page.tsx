import { PortfolioMediaCard } from "@/modules/portfolios/components/portfolio-media-card";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { notFound } from "next/navigation";


type Props = {
    params: Promise<{ username: string; slug: string }>;
};

export default async function Page({ params }: Props) {
    const { username, slug } = await params;

    const response = await userPortfolioService.getByUsername(username, slug);

    if (!response.data) {
        notFound();
    }

    const portfolio = response.data;
    const media = [...portfolio.media].sort((a, b) => a.position - b.position);

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{portfolio.title}</h1>
                {portfolio.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{portfolio.description}</p>
                )}
            </div>

            {media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {media.map((m) => (
                        <PortfolioMediaCard key={m.id} media={m} />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No media in this portfolio.</p>
            )}
        </div>
    );
}
