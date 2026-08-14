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
import { DEFAULT_OG_IMAGE } from "@/lib/config";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userAboutPageService from "@/modules/user-about-page/user-about-page.service";
import usersService from "@/modules/users/users.service";

type Props = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const [{ data: profile }, { data: aboutPage }, t] = await Promise.all([
    usersService.getProfile(username),
    userAboutPageService.getByUsername(username),
    getTranslations("artists.about"),
  ]);

  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const name =
    [profile.name, profile.surname].filter(Boolean).join(" ") ||
    `@${profile.username}`;
  const title = aboutPage?.title?.trim() || `${name} — ${t("pageTitle")}`;
  const description = aboutPage?.description?.trim()
    ? aboutPage.description.trim().slice(0, 160)
    : t("metaDescription", { name });

  // The about page is a supporting page about the same artist as /artists/{username}, so `path` is
  // the PROFILE path, not this page's: buildStaticPageMetadata then emits a canonical pointing at
  // the profile (consolidating ranking signal — no cannibalization) with hreflang alternates that
  // reference the same profile per locale. Both are per-locale, which the previous hand-rolled
  // canonical was not: it pointed /es/artists/x/about at the *English* profile, collapsing the
  // Spanish and Portuguese versions into the English one.
  return buildStaticPageMetadata({
    path: `/artists/${username}`,
    title,
    description,
    locale,
    ogType: "profile",
    // Incomplete profiles get the brand card and stay unindexed, matching the profile page and the
    // sitemap; complete ones fall back to the brand logo only so a share is never blank.
    image: profile.is_share_ready
      ? aboutPage?.photo || profile.avatar || DEFAULT_OG_IMAGE
      : DEFAULT_OG_IMAGE,
    noindex: !profile.is_share_ready,
  });
}

export default async function AboutPage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const t = await getTranslations("artists.about");
  const tEdit = await getTranslations("artists.editAria");

  const [user, { data: aboutPage }, userAuth] = await Promise.all([
    usersService.usernameExists(username),
    userAboutPageService.getByUsername(username),
    userSession(),
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

  return (
    <Web.Container className="">
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
                    alt={`About ${username} ${aboutPage.title || ""}`}
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
                {aboutPage.title && (
                  <div className="flex items-baseline gap-4">
                    <h1 className="text-4xl font-serif  tracking-tight md:text-5xl lg:text-6xl">
                      {aboutPage.title}
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
                )}
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
