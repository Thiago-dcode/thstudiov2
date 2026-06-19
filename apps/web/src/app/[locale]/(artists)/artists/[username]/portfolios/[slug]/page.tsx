import {
  buildPortfolioItemsFromFullPortfolio,
  extractMediaFromPortfolioItems,
} from "@repo/common-lib/utils/portfolio";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { Gallery } from "@repo/ui/components/custom/gallery/gallery";
import { PortfolioGrid } from "@repo/ui/components/custom/gallery/gallery-grid";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { GalleryProvider } from "@repo/ui/providers/gallery.provider";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { ResourceNotFound } from "@/app/[locale]/(artists)/__components/resource-not-found";
import Web from "@/lib/components/web-page.component";
import { config } from "@/lib/config";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ ci?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { username, slug } = await params;

  const [userExist, response, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getByUsername(username, slug),
    userSession(),
  ]);
  if (!userExist.data) {
    notFound();
  }

  const portfolio = response.data;
  if (!portfolio || portfolio.blocked_at) {
    return (
      <Web.Container>
        <ResourceNotFound
          username={username}
          message="The portfolio you're looking for doesn't exist or may have been removed."
        />
      </Web.Container>
    );
  }

  const portfolioItems = buildPortfolioItemsFromFullPortfolio(portfolio);
  const mediaItems = extractMediaFromPortfolioItems(portfolioItems);
  const canEdit = userAuth?.id === portfolio.user_id;
  const qp = await searchParams;

  let defaultCurrentItem: number | undefined;

  if (qp?.ci) {
    const index = mediaItems.findIndex((m) => m.public_id === qp.ci);
    if (index !== -1) {
      defaultCurrentItem = index;
    }
  }

  return (
    <Web.Container>
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/portfolios`,
            title: "Portfolios",
            isActive: false,
          },
          {
            url: `/artists/${username}/portfolios/${slug}`,
            title: portfolio.title,
            isActive: true,
          },
        ]}
      />

      <Web.Header
        title={portfolio.title}
        description={portfolio.description || undefined}
      >
        {canEdit && (
          <Link
            href={`/atelier/portfolios/edit/${portfolio.slug}`}
            aria-label="Edit portfolio"
            className="text-text-muted hover:text-text transition-colors self-start md:self-auto"
          >
            <Pencil className="size-4 md:size-5" />
          </Link>
        )}
      </Web.Header>

      {portfolio.categories && portfolio.categories.length > 0 && (
        <nav
          aria-label="Portfolio categories"
          className="mb-10 flex flex-wrap items-center gap-2"
        >
          {portfolio.categories.map((category) => (
            <Link
              key={category.id}
              href={queryParamBuilder(
                "/artists",
                { categories: [category.slug] },
                { arrayStyle: "commas" },
              )}
              className="group inline-flex items-center"
            >
              <Badge
                variant="outline"
                className="border-border/40 bg-fg-2/20 px-3 py-1 text-[11px] font-normal tracking-wide text-text-muted transition-all duration-200 group-hover:border-border/70 group-hover:bg-fg-1/40 group-hover:text-text"
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </nav>
      )}

      <section className="relative m-auto">
        {portfolio.media.length > 0 ? (
          <GalleryProvider
            defaultCurrentItem={defaultCurrentItem}
            items={mediaItems.map((m) => ({
              title: `${m.title ?? ""} ${m.fromCollection ? ` (Collection: ${m.fromCollection})` : ""}`,
              description: m.seo_description ?? undefined,
              url: m.url ?? m.thumbnail,
              alt: m.seo_alt ?? m.title ?? undefined,
              href: `${config.app_url}/artists/${username}/portfolios/${slug}/media/${m.public_id}?cb=1`,
              shared: `${config.app_url}/artists/${username}/portfolios/${slug}/media/${m.public_id}`,
            }))}
          >
            <PortfolioGrid portfolioItems={portfolioItems} />
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
