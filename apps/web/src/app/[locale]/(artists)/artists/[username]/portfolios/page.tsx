import { normalizeUsername } from "@repo/common-lib/utils/username";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { buildArtistListMetadata } from "@/app/[locale]/(artists)/__components/artist-list-metadata";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import {
  artistDisplayName,
  buildArtistListJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

/** Public list: deactivated portfolios are the owner's business, not visitors'. */
const PUBLIC_FILTERS = { blocked: false, is_active: true } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const { data: portfolios } = await userPortfolioService.getAllByUsername(
    username,
    PUBLIC_FILTERS,
  );
  return buildArtistListMetadata({
    kind: "portfolios",
    locale,
    username,
    count: portfolios?.length ?? 0,
    image: portfolios?.[0]?.thumbnail,
  });
}

export default async function Page({ params }: Props) {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const t = await getTranslations("artists.portfolios");

  const [userExist, response, profile] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getAllByUsername(username, PUBLIC_FILTERS),
    getArtistProfile(username),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const portfolios = response.data || [];
  const name = profile ? artistDisplayName(profile) : `@${username}`;

  return (
    <Web.Container>
      {profile?.is_share_ready && portfolios.length > 0 && (
        <JsonLd
          data={buildArtistListJsonLd({ username, name }, locale, {
            path: `/artists/${username}/portfolios`,
            name: t("listTitle", { name }),
            items: portfolios.map((p) => ({
              name: p.title,
              path: `/artists/${username}/portfolios/${p.slug}`,
              image: p.thumbnail,
            })),
          })}
        />
      )}
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/portfolios`,
            title: t("pageTitle"),
            isActive: true,
          },
        ]}
      />

      <Web.Header title={t("pageTitle")} />

      {portfolios.length > 0 ? (
        <Web.List>
          {portfolios.map((portfolio) => (
            <Link
              className="block w-full min-w-0"
              key={portfolio.id}
              href={`/artists/${username}/portfolios/${portfolio.slug}`}
            >
              <PortfolioCard.Item portfolio={portfolio} />
            </Link>
          ))}
        </Web.List>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm  text-text-muted">
          {t("empty")}
        </div>
      )}
    </Web.Container>
  );
}
