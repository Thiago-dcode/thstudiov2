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
    searchParams: Promise<{ ci?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
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

    const qp= await searchParams;

    let defaultCurrentItem: number | undefined = undefined;

    if (qp?.ci) {

        const splitted = qp.ci.split('_');
        if (splitted.length === 2) {
            const validTypes = ['m'];
            const itemType = splitted[0];

            if (validTypes.find(vt => vt === itemType)) {

                if (itemType === 'm') {
                    const public_id = splitted[1];
                    const index = portfolio.media.findIndex(m => m.public_id === public_id);
                    if (index !== -1) {
                        defaultCurrentItem = index;
                    }
                }
            }

        }
    }


    return (
        <Web.Container>
            <ArtistBreadcrumb
                username={username}
                items={[
                    { url: `/artists/${username}/portfolios`, title: "Portfolios", isActive: false },
                    { url: `/artists/${username}/portfolios/${slug}`, title: portfolio.title, isActive: true },
                ]}
            />

            <Web.Header
                title={portfolio.title}
                description={portfolio.description || undefined}
            >
                {canEdit && (
                    <Link
                        href={`/atelier/portfolio/edit/${portfolio.slug}`}
                        aria-label="Edit portfolio"
                        className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
                    >
                        <Pencil className="size-4 md:size-5" />
                    </Link>
                )}
            </Web.Header>

            <section className="relative">
                {portfolio.media.length > 0 ? (
                    <GalleryProvider
                        defaultCurrentItem={defaultCurrentItem}
                        items={portfolio.media.map((m) => ({
                            title: m.title,
                            description: m.seo_description ?? undefined,
                            url: m.url ?? m.thumbnail,
                            alt: m.seo_alt ?? m.title ?? undefined,
                            href:`${config.app_url}/artists/${username}/portfolios/${slug}/media/${m.public_id}?cb=1`,
                            shared: `${config.app_url}/artists/${username}/portfolios/${slug}/media/${m.public_id}`
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
