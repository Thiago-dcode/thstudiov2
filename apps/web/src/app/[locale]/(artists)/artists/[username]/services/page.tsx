import { normalizeUsername } from "@repo/common-lib/utils/username";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { buildArtistListMetadata } from "@/app/[locale]/(artists)/__components/artist-list-metadata";
import Web from "@/lib/components/web-page.component";
import { redirectToCanonicalUsername } from "@/lib/seo/core";
import {
  artistDisplayName,
  buildArtistListJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { ServiceCard } from "@/modules/user-services/components/service-card";
import userServiceService from "@/modules/user-services/user-service.service";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

const PUBLIC_FILTERS = { is_active: true, blocked: false } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  redirectToCanonicalUsername(locale, rawUsername, "/services");
  const username = normalizeUsername(rawUsername);
  const { data } = await userServiceService.getAllByUsername(
    username,
    PUBLIC_FILTERS,
  );
  const services = (data ?? []).filter((s) => s.is_active);
  return buildArtistListMetadata({
    kind: "services",
    locale,
    username,
    count: services.length,
    image: services[0]?.thumbnail,
  });
}

export default async function Page({ params }: Props) {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const t = await getTranslations("artists.services");

  const [userExist, response, profile] = await Promise.all([
    usersService.usernameExists(username),
    userServiceService.getAllByUsername(username, PUBLIC_FILTERS),
    getArtistProfile(username),
  ]);

  if (!userExist.data) {
    notFound();
  }

  if (!response.data) {
    notFound();
  }

  const services = response.data.filter((s) => s.is_active);
  const name = profile ? artistDisplayName(profile) : `@${username}`;

  return (
    <Web.Container>
      {profile?.is_share_ready && services.length > 0 && (
        <JsonLd
          data={buildArtistListJsonLd({ username, name }, locale, {
            path: `/artists/${username}/services`,
            name: t("listTitle", { name }),
            items: services.map((s) => ({
              name: s.title,
              path: `/artists/${username}/services/${s.slug}`,
              image: s.thumbnail,
            })),
          })}
        />
      )}
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
