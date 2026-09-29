import { normalizeUsername } from "@repo/common-lib/utils/username";
import { Mail, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArtistBreadcrumb } from "@/app/[locale]/(artists)/__components/artist-breadcrumb";
import { ArtistContactDialog } from "@/app/[locale]/(artists)/__components/artist-contact.dialog";
import { Link } from "@/i18n/navigation";
import Web from "@/lib/components/web-page.component";
import { isMissingResponse, redirectToCanonicalUsername } from "@/lib/seo/core";
import {
  artistDisplayName,
  buildArtistAboutJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userAboutPageService from "@/modules/user-about-page/user-about-page.service";
import { getArtistProfileResponse } from "@/modules/users/get-artist-share-ready";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  redirectToCanonicalUsername(locale, rawUsername, "/about");
  const username = normalizeUsername(rawUsername);
  const [response, { data: aboutPage }, t] = await Promise.all([
    getArtistProfileResponse(username),
    userAboutPageService.getByUsername(username),
    getTranslations("artists.about"),
  ]);
  const profile = response.data;

  if (isMissingResponse(response)) notFound();
  if (!profile) return { robots: { index: false, follow: false } };

  const name = artistDisplayName(profile);
  const aboutTitle = aboutPage?.title?.trim();
  // The artist's own heading ("Who I'm?") says nothing about who they are on its own, so it is always
  // paired with their name.
  const title = aboutTitle
    ? t("metaTitleNamed", { title: aboutTitle, name })
    : t("metaTitleDefault", { name });

  // Self-canonical. It used to canonicalize to the profile, but this page is not a duplicate of it
  // (long-form story + portrait), and Google ignores a canonical between non-equivalent pages — it
  // only sent a conflicting signal and hid the long-form bio answer engines are most likely to quote.
  // No story yet (or an incomplete profile) → a thin page: kept out of the index, not 404'd, so the
  // owner can still reach it.
  return buildStaticPageMetadata({
    path: `/artists/${profile.username}/about`,
    title,
    description:
      aboutPage?.description?.trim() || t("metaDescription", { name }),
    locale,
    ogType: "profile",
    image: profile.is_share_ready ? aboutPage?.photo || profile.avatar : null,
    noindex: !profile.is_share_ready || !aboutPage,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const t = await getTranslations("artists.about");
  const tEdit = await getTranslations("artists.editAria");

  const [user, { data: aboutPage }, userAuth, { data: profile }] =
    await Promise.all([
      usersService.usernameExists(username),
      userAboutPageService.getByUsername(username),
      userSession(),
      getArtistProfileResponse(username),
    ]);

  if (!user.data) {
    notFound();
  }
  const canEdit = userAuth?.username === username;

  if (!aboutPage) {
    return (
      <Web.Container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm  text-text-muted tracking-wide">
            {t("notShared")}
          </p>
        </div>
      </Web.Container>
    );
  }

  const name = profile ? artistDisplayName(profile) : `@${username}`;

  return (
    <Web.Container className="">
      {profile?.is_share_ready && (
        <JsonLd
          data={buildArtistAboutJsonLd({ username, name }, locale, {
            name: aboutPage.title || t("metaTitleDefault", { name }),
            description: aboutPage.description,
            image: aboutPage.photo,
            crumb: t("heading"),
          })}
        />
      )}
      <ArtistBreadcrumb
        username={username}
        items={[
          {
            url: `/artists/${username}/about`,
            title: t("heading"),
            isActive: true,
          },
        ]}
      />
      <div className="w-full items-start justify-center flex">
        <div className="">
          <div className="flex w-full flex-col lg:flex-row gap-12 lg:gap-20">
            {aboutPage.photo && (
              <div className="shrink-0 lg:sticky lg:top-24 lg:self-start">
                <div className="relative aspect-3/4 w-full max-w-sm lg:w-80 xl:w-96 overflow-hidden">
                  <Image
                    src={aboutPage.photo}
                    alt={t("photoAlt", { name })}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 384px"
                    priority
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col justify-center gap-10 flex-1 min-w-0">
              <div className="space-y-2">
                {/* Always an h1: an about page without its own title used to render none. */}
                <div className="flex items-baseline gap-4">
                  <h1 className="text-4xl font-serif  tracking-tight md:text-5xl lg:text-6xl">
                    {aboutPage.title || t("metaTitleDefault", { name })}
                  </h1>
                  {canEdit && (
                    <Link
                      href="/atelier/about"
                      aria-label={tEdit("editAboutPage")}
                      className="text-text-muted hover:text-text transition-colors"
                    >
                      <Pencil className="size-4 md:size-5" />
                    </Link>
                  )}
                </div>
              </div>

              {aboutPage.description && (
                <p className="text-base leading-[1.8] text-text-muted whitespace-pre-line md:text-lg max-w-xl">
                  {aboutPage.description}
                </p>
              )}

              <div className="pt-4 border-t border-border/40">
                <ArtistContactDialog>
                  <button
                    type="button"
                    className="inline-flex items-center gap-3 text-sm tracking-wider uppercase hover:text-text text-text-muted transition-colors duration-300 group"
                  >
                    <Mail className="size-4 transition-transform duration-300 group-hover:-translate-y-px" />
                    <span>{t("getInTouch")}</span>
                  </button>
                </ArtistContactDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Web.Container>
  );
}
