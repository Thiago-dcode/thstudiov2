import { PortfolioGrid } from "@/modules/portfolios/components/portfolio-grid";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { notFound } from "next/navigation";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Gallery } from "@repo/ui/components/custom/gallery";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { config } from "@/lib/config";
import Web from "@/lib/components/web-page.component";
import { ArtistBreadcrumb } from "@/app/(artists)/__components/artist-breadcrumb";

type Props = {
    params: Promise<{ username: string; slug: string }>;
};

export default async function Page({ params }: Props) {
    const { username, slug } = await params;

    const [response, userAuth] = await Promise.all([
        userPortfolioService.getByUsername(username, slug),
        userSession(),
    ]);

    if (!response.data) {
        notFound();
    }

    const portfolio = response.data;
    portfolio.media.sort((a, b) => a.position - b.position);
    const canEdit = userAuth?.id === portfolio.user_id;


    return (
        <Web.Container>
            <ArtistBreadcrumb
                username={username}
                items={[
                    { url: `/artists/${username}/portfolios`, title: "Portfolios", isActive: false },
                    { url: `/artists/${username}/portfolios/${slug}`, title: portfolio.title, isActive: true },
                ]}
            />

            <header className="mt-8 mb-6 md:mb-10 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-6">
                <div className="max-w-2xl space-y-2">
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-3xl font-serif italic tracking-tight tablet:text-5xl desktop:text-6xl">
                            {portfolio.title}
                        </h1>
                        {canEdit && (
                            <Link
                                href={`/atelier/portfolio/edit/${portfolio.slug}`}
                                aria-label="Edit portfolio"
                                className="text-text-muted hover:text-text transition-colors"
                            >
                                <Pencil className="size-4 md:size-5" />
                            </Link>
                        )}
                    </div>

                    {portfolio.description && (
                        <p className="max-w-xl text-base leading-relaxed text-text-muted md:text-lg">
                            {portfolio.description}
                        </p>
                    )}
                </div>
            </header>

            <section className="relative">
                {portfolio.media.length > 0 ? (
                    <GalleryProvider
                        items={portfolio.media.map((m) => ({
                            title: m.title,
                            description: m.seo_description ?? undefined,
                            url: m.url ?? m.thumbnail,
                            alt: m.seo_alt ?? m.title ?? undefined,
                            shared: `${config.app_url}/artists/media/${m.public_id}`
                        }))}
                    >
                        <PortfolioGrid portfolio={portfolio} />
                        <div className="hidden tablet:block">
                            <Gallery />
                        </div>
                    </GalleryProvider>
                ) : (
                    <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm italic text-text-muted">
                        This collection is currently empty.
                    </div>
                )}
            </section>
        </Web.Container>
    );
}
