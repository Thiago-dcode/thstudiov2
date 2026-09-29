import { normalizeUsername } from "@repo/common-lib/utils/username";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { ArrowRight, Globe, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import { Link } from "@/i18n/navigation";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/lib/components/social-icons";
import { isMissingResponse, redirectToCanonicalUsername } from "@/lib/seo/core";
import {
  artistDisplayName,
  buildProfileJsonLd,
  JsonLd,
} from "@/lib/seo/json-ld";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import userServiceService from "@/modules/user-services/user-service.service";
import { getArtistProfileResponse } from "@/modules/users/get-artist-share-ready";
import { ArtistContactDialog } from "../../__components/artist-contact.dialog";
import { ArtistSections } from "../../__components/artist-sections";
import { ArtistSectionsSkeleton } from "../../__components/artist-sections-skeleton";

type Props = { params: Promise<{ locale: string; username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  redirectToCanonicalUsername(locale, rawUsername, "");
  const username = normalizeUsername(rawUsername);
  const [response, t] = await Promise.all([
    getArtistProfileResponse(username),
    getTranslations("artists.profile"),
  ]);
  const profile = response.data;

  // A real 404 for an unknown artist: metadata resolves before the first byte, so this still sets
  // the status even though the page itself sits under the streaming root `loading.tsx`.
  if (isMissingResponse(response)) notFound();
  if (!profile) return { robots: { index: false, follow: false } };

  const path = `/artists/${profile.username}`;

  // A profile still missing work, name, profession or locality must not read as a finished artist
  // page: a messenger caches whatever it fetched the first time, so pasting the link would keep
  // showing a polished card for an unfinished profile. Brand card + neutral copy + noindex until
  // the artist completes it (same gate as the sitemap — see `is_share_ready`).
  if (!profile.is_share_ready) {
    return buildStaticPageMetadata({
      path,
      title: `@${profile.username}`,
      description: t("metaIncomplete"),
      locale,
      noindex: true,
    });
  }

  const name = artistDisplayName(profile);
  // Share-ready guarantees both, so the fallbacks always have real values to fill in.
  const profession = profile.profession?.trim() ?? "";
  const location =
    profile.address?.city?.trim() || profile.address?.state?.trim() || "";
  const summary = t("summaryProfessionLocation", {
    name,
    profession,
    location,
  });

  // The AI-generated copy is already resolved to this locale by the API (falling back to the EN
  // row). It is only ever a replacement, never a gap: when generation has not run — or its output
  // was rejected — these hand-built strings still carry the page. The fallback title leads with the
  // name (what people type) and carries the locality (what local searches match on).
  return buildStaticPageMetadata({
    path,
    title:
      profile.seo_title?.trim() ||
      t("metaTitleLocation", { name, profession, location }),
    description:
      profile.seo_description?.trim() ||
      profile.short_biography?.trim() ||
      summary,
    locale,
    image: profile.banner || profile.avatar,
    ogType: "profile",
    profile: {
      firstName: profile.name ?? undefined,
      lastName: profile.surname ?? undefined,
      username: profile.username,
    },
  });
}

const ArtistHomePage = async ({ params }: Props) => {
  const { locale, username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const [{ data: profile }, { data: services }, t] = await Promise.all([
    getArtistProfileResponse(username),
    userServiceService.getAllByUsername(username, {
      blocked: false,
      is_active: true,
    }),
    getTranslations("artists.profile"),
  ]);

  if (!profile) {
    notFound();
  }

  const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");
  const heading = fullName || `@${profile.username}`;
  // Structured data only for profiles we let search engines and answer engines treat as real artist
  // entities — an incomplete profile is noindexed, so publishing its contact facts buys nothing.
  const jsonLd = profile.is_share_ready
    ? buildProfileJsonLd(profile, services ?? [], locale)
    : null;

  const profession = profile.profession?.trim();

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-1000">
      {jsonLd && <JsonLd data={jsonLd} />}

      {/* Hero Banner — full-bleed up to desktop */}
      <section className="relative w-full" aria-label={t("bannerRegion")}>
        <div className="relative h-[30vh] w-full tablet:h-[38vh] laptop:h-[42vh] desktop:h-[46vh]">
          <Image
            alt={t("bannerAlt", { name: heading })}
            src={profile.banner || fallbackBanner}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/20 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-transparent" />
        </div>

        {/* Avatar — anchored at banner bottom */}
        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
          <div className="relative size-32 overflow-hidden bg-fg shadow-2xl ring-[5px] ring-bg tablet:size-36 laptop:size-40 rounded-full!">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={t("avatarAlt", { name: heading })}
                fill
                className="object-cover"
                sizes="160px"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-serif text-5xl  text-text-muted/50">
                  {profile.username?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Profile Identity + CTAs */}
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 pt-24 pb-12 text-center tablet:pt-28">
        <div className="space-y-3">
          <h1 className="font-serif  tracking-tight tablet:text-4xl laptop:text-5xl">
            {heading}
          </h1>
          {profession && (
            <p className="text-sm tracking-wide text-text-muted tablet:text-base">
              {profession}
            </p>
          )}
          {fullName && <p className=" text-text">@{profile.username}</p>}
        </div>

        {profile.address?.formated_address && (
          <p className="flex items-center gap-1.5 text-sm text-text-muted/80">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{profile.address.formated_address}</span>
          </p>
        )}

        {profile.categories.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2">
            {profile.categories.map((cat) => (
              <li key={cat.id}>
                <Badge variant="secondary">{cat.name}</Badge>
              </li>
            ))}
          </ul>
        )}

        {/* CTAs — directly under identity */}
        <div className="flex flex-col items-center justify-center gap-3 pt-4 phone-lg:flex-row">
          <ArtistContactDialog>
            <button
              type="button"
              className="group inline-flex min-h-11 cursor-pointer items-center gap-2.5 bg-text px-7 py-3 text-xs tracking-[0.15em] text-bg uppercase transition-all duration-300 hover:bg-text/90"
            >
              <Mail
                className="size-3.5 transition-transform duration-300 group-hover:-translate-y-px"
                aria-hidden="true"
              />
              <span>{t("getInTouch")}</span>
            </button>
          </ArtistContactDialog>

          <Link
            href={`/artists/${profile.username}/about`}
            className="group inline-flex min-h-11 items-center gap-2.5 border border-border/50 px-7 py-3 text-xs tracking-[0.15em] text-text-muted uppercase transition-all duration-300 hover:border-text/30 hover:text-text"
          >
            <span>{t("aboutHeading", { name: heading })}</span>
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Social & contact links — quiet, secondary to the identity + CTAs */}
        {(profile.phone_number ||
          profile.instagram_link ||
          profile.facebook_link ||
          profile.youtube_link ||
          profile.website_link) && (
          <nav
            aria-label={t("connect")}
            className="flex flex-wrap items-center justify-center gap-2 pt-2"
          >
            {profile.phone_number && (
              <a
                href={`tel:${profile.phone_number}`}
                aria-label={t("phoneLabel", { name: heading })}
                className="inline-flex size-11 items-center justify-center border border-border/50 text-text-muted transition-colors duration-300 hover:border-text/30 hover:text-text"
              >
                <Phone className="size-4" aria-hidden="true" />
              </a>
            )}
            {/* Artist-supplied outbound links are user-generated content: `nofollow ugc` so a
                directory of artist profiles doesn't become a link farm, and so a spam profile
                can't pass A11STUDIO's authority to an arbitrary site. `Person.sameAs` in the
                JSON-LD still carries the raw URLs — that's entity identity, not a link vote. */}
            {profile.instagram_link && (
              <a
                href={profile.instagram_link}
                target="_blank"
                rel="noreferrer noopener nofollow ugc"
                aria-label={t("instagramLabel", { name: heading })}
                className="inline-flex size-11 items-center justify-center border border-border/50 text-text-muted transition-colors duration-300 hover:border-text/30 hover:text-text"
              >
                <InstagramIcon className="size-4" />
              </a>
            )}
            {profile.facebook_link && (
              <a
                href={profile.facebook_link}
                target="_blank"
                rel="noreferrer noopener nofollow ugc"
                aria-label={t("facebookLabel", { name: heading })}
                className="inline-flex size-11 items-center justify-center border border-border/50 text-text-muted transition-colors duration-300 hover:border-text/30 hover:text-text"
              >
                <FacebookIcon className="size-4" />
              </a>
            )}
            {profile.youtube_link && (
              <a
                href={profile.youtube_link}
                target="_blank"
                rel="noreferrer noopener nofollow ugc"
                aria-label={t("youtubeLabel", { name: heading })}
                className="inline-flex size-11 items-center justify-center border border-border/50 text-text-muted transition-colors duration-300 hover:border-text/30 hover:text-text"
              >
                <YoutubeIcon className="size-4" />
              </a>
            )}
            {profile.website_link && (
              <a
                href={profile.website_link}
                target="_blank"
                rel="noreferrer noopener nofollow ugc"
                aria-label={t("websiteLabel", { name: heading })}
                className="inline-flex size-11 items-center justify-center border border-border/50 text-text-muted transition-colors duration-300 hover:border-text/30 hover:text-text"
              >
                <Globe className="size-4" aria-hidden="true" />
              </a>
            )}
          </nav>
        )}
      </section>

      {/* Short Biography — editorial pull-quote */}
      {profile.short_biography && (
        <section
          className="mx-auto w-full max-w-(--breakpoint-desktop-lg) px-4 pb-20 phone-lg:px-6 tablet:px-10 laptop:px-12"
          aria-label={t("bioRegion")}
        >
          <div className="relative py-8">
            <blockquote className="mx-auto w-full text-center font-serif text-base leading-[1.9] text-text-muted  tablet:text-lg">
              &ldquo;{profile.short_biography}&rdquo;
            </blockquote>
          </div>
        </section>
      )}

      {/* Highlighted Content Sections */}
      <div className="w-full pt-8 pb-24">
        <Suspense fallback={<ArtistSectionsSkeleton />}>
          <ArtistSections username={profile.username} displayName={heading} />
        </Suspense>
      </div>
    </div>
  );
};

export default ArtistHomePage;
