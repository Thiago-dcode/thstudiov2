import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { normalizeUsername } from "@repo/common-lib/utils/username";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { PortfolioCard } from "@/modules/portfolios/components/portfolio-card";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const [{ data: profile }, t] = await Promise.all([
    usersService.getProfile(username),
    getTranslations("artists.portfolios"),
  ]);

  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const name =
    [profile.name, profile.surname].filter(Boolean).join(" ") || `@${username}`;
  return buildStaticPageMetadata({
    path: `/artists/${username}/portfolios`,
    title: `${name} — ${t("pageTitle")}`,
    description: t("metaDescription", { name }),
    locale,
    // An incomplete profile stays out of the index and off rich share cards — same gate as the
    // profile page and the sitemap, so the artist's surfaces can't disagree.
    image: profile.is_share_ready
      ? profile.banner || profile.avatar || undefined
      : undefined,
    noindex: !profile.is_share_ready,
  });
}

export default async function Page({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const t = await getTranslations("artists.portfolios");

  const [userExist, response] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getAllByUsername(username, { blocked: false }),
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
