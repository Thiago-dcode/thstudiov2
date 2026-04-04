import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";
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

    const [userExist, response] = await Promise.all([
        usersService.usernameExists(username),
        userPortfolioService.getAllByUsername(username)
    ]);

    if (!userExist.data) {
        notFound();
    }

    const portfolios = response.data || [];

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
                <Web.List>
                    {portfolios.map((portfolio) => (
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
                                    <h2 className="text-sm font-serif italic tracking-tight text-white drop-shadow-md md:text-base">
                                        {portfolio.title}
                                    </h2>
                                    {portfolio.description && (
                                        <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-white/70">
                                            {portfolio.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-sm transition-all duration-500 group-hover:ring-white/20" />
                        </Link>
                    ))}
                </Web.List>
            ) : (
                <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm italic text-text-muted">
                    No portfolios yet.
                </div>
            )}
        </Web.Container>
    );
}
