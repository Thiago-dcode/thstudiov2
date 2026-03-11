import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Web from "@/lib/components/web-page.component";
import { ArtistBreadcrumb } from "@/app/(artists)/__components/artist-breadcrumb";

type Props = {
    params: Promise<{ username: string }>;
};

export default async function Page({ params }: Props) {
    const { username } = await params;

    const response = await userPortfolioService.getAllByUsername(username);

    if (!response.data) {
        notFound();
    }

    const portfolios = response.data;

    return (
        <Web.Container>
            <ArtistBreadcrumb
                username={username}
                items={[
                    { url: `/artists/${username}/portfolios`, title: "Portfolios", isActive: true },
                ]}
            />

            <Web.Header title="Portfolios" />

            {portfolios.length > 0 ? (
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 tablet:gap-8">
                    {portfolios.map((portfolio) => (
                        <Link
                            key={portfolio.id}
                            href={`/artists/${username}/portfolios/${portfolio.slug}`}
                            className="group relative flex flex-col overflow-hidden rounded-sm"
                        >
                            <div className="relative aspect-4/3 w-full overflow-hidden bg-fg-1">
                                {portfolio.thumbnail ? (
                                    <>
                                        <Image
                                            src={portfolio.thumbnail}
                                            alt={portfolio.title}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, 50vw"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-fg-1">
                                        <span className="font-serif text-5xl italic text-text-muted/30">
                                            {portfolio.title.charAt(0)}
                                        </span>
                                    </div>
                                )}

                                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                                    <h2 className="text-lg font-serif italic tracking-tight text-white drop-shadow-md md:text-xl desktop:text-2xl">
                                        {portfolio.title}
                                    </h2>
                                    {portfolio.description && (
                                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/70">
                                            {portfolio.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-sm transition-all duration-500 group-hover:ring-white/20" />
                        </Link>
                    ))}
                </section>
            ) : (
                <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm italic text-text-muted">
                    No portfolios yet.
                </div>
            )}
        </Web.Container>
    );
}
