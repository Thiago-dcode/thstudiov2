import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { normalizeUsername } from "@repo/common-lib/utils/username";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import Web from "@/lib/components/web-page.component";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import userServiceService from "@/modules/user-services/user-service.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const [{ data: profile }, t] = await Promise.all([
    usersService.getProfile(username),
    getTranslations("artists.services"),
  ]);

  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const name =
    [profile.name, profile.surname].filter(Boolean).join(" ") || `@${username}`;
  return buildStaticPageMetadata({
    path: `/artists/${username}/services`,
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
  const t = await getTranslations("artists.services");

  const [userExist, response] = await Promise.all([
    usersService.usernameExists(username),
    userServiceService.getAllByUsername(username, {
      is_active: true,
      blocked: false,
    }),
  ]);

  if (!userExist.data) {
    notFound();
  }

  if (!response.data) {
    notFound();
  }

  const services = response.data.filter((s) => s.is_active);

  return (
    <Web.Container>
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/services`,
            title: t("pageTitle"),
            isActive: true,
          },
        ]}
      />

      <Web.Header title={t("pageTitle")} />

      {services.length > 0 ? (
        <section className=" grid-cols-1 tablet:grid-cols-2 gap-5 grid laptop:grid-cols-3 desktop-lg:grid-cols-5 tablet:gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              username={username}
            />
          ))}
        </section>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm  text-text-muted">
          {t("empty")}
        </div>
      )}
    </Web.Container>
  );
}
