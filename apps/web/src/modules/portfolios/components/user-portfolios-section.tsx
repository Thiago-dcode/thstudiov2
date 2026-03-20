import portfolioService from "../portfolio.service";
import Link from "next/link";
import Image from "next/image";

export const UserPortfoliosSection = async ({ userId, username, displayName }: {
    userId: number;
    username: string;
    displayName: string;
}) => {
    const response = await portfolioService.findAll({
        user_id: userId,
        paginated: false,
    });

    if (response.error || !response.data?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm tracking-wide text-text-muted/70">
                    {displayName} has no portfolios yet&hellip;
                </p>
            </div>
        );
    }

    return (
        <section className="w-full max-w-5xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 tablet:grid-cols-4 tablet:gap-5">
                {response.data.map((portfolio) => (
                    <Link
                        key={portfolio.id}
                        href={`/artists/${username}/portfolios/${portfolio.slug}`}
                        className="group relative flex flex-col overflow-hidden rounded-sm"
                    >
                        <div className="relative aspect-square w-full overflow-hidden bg-fg-1">
                            {portfolio.thumbnail ? (
                                <>
                                    <Image
                                        src={portfolio.thumbnail}
                                        alt={portfolio.title}
                                        fill
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500" />
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-fg-1">
                                    <span className="font-serif text-3xl italic text-text-muted/30">
                                        {portfolio.title.charAt(0)}
                                    </span>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                                <h3 className="text-sm font-serif italic tracking-tight text-white drop-shadow-md md:text-base">
                                    {portfolio.title}
                                </h3>
                            </div>
                        </div>

                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-sm transition-all duration-500 group-hover:ring-white/20" />
                    </Link>
                ))}
            </div>
        </section>
    );
};
