import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MediaPageComponent } from "@/app/[locale]/(artists)/__components/media-page.component";
import { urlLocaleToLanguageCode } from "@/i18n/routing";
import { buildSeoMetadata } from "@/lib/seo/build-metadata";
import { isMissingResponse } from "@/lib/seo/core";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{
    locale: string;
    username: string;
    slug: string;
    public_id: string;
  }>;
  searchParams: Promise<{
    cb?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username, public_id } = await params;
  const [response, t] = await Promise.all([
    mediaService.getSeoMetadata(public_id, urlLocaleToLanguageCode(locale)),
    getTranslations("artists.media"),
  ]);

  if (isMissingResponse(response)) notFound();
  const { data } = response;
  if (!data) return { robots: { index: false, follow: false } };

  // canonical_path is the PRIMARY media URL (/artists/{username}/media/{public_id}), so this nested
  // view consolidates its ranking signal there instead of cannibalizing it.
  return buildSeoMetadata(data, locale, {
    title: t("titleFallback", { name: `@${username}` }),
  });
}

export default async function MediaPage({ params, searchParams }: Props) {
  const { locale, username, slug, public_id } = await params;
  const tPortfolios = await getTranslations("artists.portfolios");

  const [user, portfolioResponse, session] = await Promise.all([
    usersService.usernameExists(username),
    userPortfolioService.getByUsername(username, slug),
    userSession(),
  ]);

  if (!user.data) {
    notFound();
  }

  const portfolio = portfolioResponse.data;
  if (!portfolio || portfolio.blocked_at) {
    notFound();
  }

  const { data: media } = await mediaService.getByPublicId(
    public_id,
    urlLocaleToLanguageCode(locale),
  );

  const belongsToPortfolio =
    !!media &&
    (portfolio.media.some((m) => m.public_id === media.public_id) ||
      portfolio.collections.some((c) =>
        c.media.some((m) => m.public_id === media.public_id),
      ));

  if (
    !media ||
    media.blocked_at ||
    !media.completed_at ||
    !belongsToPortfolio
  ) {
    notFound();
  }

  const canEdit = session?.id === media.user_id;

  const qp = await searchParams;

  const acceptCallback = qp?.cb === "1";
  const portfolioUrl = `/artists/${username}/portfolios/${slug}`;
  const backUrl = `${portfolioUrl}${acceptCallback ? `?ci=${encodeURIComponent(media.public_id)}` : ""}`;

  return (
    <MediaPageComponent
      user={media.user ?? { username }}
      media={media}
      canEdit={canEdit}
      backUrl={backUrl}
      breadcrumbs={[
        {
          title: tPortfolios("pageTitle"),
          url: `/artists/${username}/portfolios`,
          isActive: false,
        },
        {
          // The portfolio's title — the raw slug ("Portfolios my-best-drone-shots") used to show here.
          title: portfolio.title,
          url: backUrl,
          isActive: false,
        },
      ]}
    />
  );
}
