import portfolioService from "../portfolio.service";
import Link from "next/link";

export const UserPortfoliosSection = async ({ userId, username }: {
    userId: number;
    username: string;
}) => {
    const response = await portfolioService.findAll({
        user_id: userId,
        paginated: false,
    });
    console.log(response)

    if (response.error || !response.data?.length) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {response.data.map((portfolio) => (
                <Link key={portfolio.id} href={`/artists/${username}/portfolios/${portfolio.slug}`}>
                    <article className="group cursor-pointer aspect-square rounded-lg border border-border overflow-hidden relative">
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
    );
};
