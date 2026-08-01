import { PLATFORM_CURRENCY } from "@repo/common-lib/constants/constants";
import type { Service } from "@repo/common-lib/types/service";
import type { UserProfile } from "@repo/common-lib/types/user";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { ArrowRight, Globe, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import { serverEnv } from "@/env/server";
import { Link } from "@/i18n/navigation";
import { DEFAULT_OG_IMAGE } from "@/lib/config";
import userServiceService from "@/modules/user-services/user-service.service";
import UserService from "@/modules/users/users.service";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/lib/components/social-icons";
import { ArtistContactDialog } from "../../__components/artist-contact.dialog";
import { ArtistSections } from "../../__components/artist-sections";
import { ArtistSectionsSkeleton } from "../../__components/artist-sections-skeleton";

type Props = { params: Promise<{ username: string }> };

const SITE_NAME = "A11STUDIO";

const displayName = (profile: UserProfile) =>
  [profile.name, profile.surname].filter(Boolean).join(" ") ||
  `@${profile.username}`;

const canonicalUrl = (username: string) =>
  `${serverEnv.APP_URL}/artists/${username}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await UserService.getProfile(username);

  if (!profile) {
    const t = await getTranslations("artists.notFound");
    return {
      title: t("heading"),
      robots: { index: false, follow: false },
    };
  }

  const name = displayName(profile);
  const title = profile.profession
    ? `${name} — ${profile.profession}`
    : `${name} (@${profile.username})`;
  const description = profile.short_biography?.trim()
    ? profile.short_biography.trim().slice(0, 160)
    : `Discover ${name}'s portfolios, collections and services on ${SITE_NAME}.`;
  const canonical = canonicalUrl(profile.username);
  // Prefer the artist's own banner/avatar; fall back to the brand logo so share cards are never blank.
  const ogImage = profile.banner || profile.avatar || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const buildProfileJsonLd = (profile: UserProfile, services: Service[]) => {
  const name = displayName(profile);
  const canonical = canonicalUrl(profile.username);

  const addr = profile.address;
  const address =
    addr && (addr.street || addr.city || addr.state || addr.formated_address)
      ? {
          "@type": "PostalAddress",
          ...(addr.street ? { streetAddress: addr.street } : {}),
          ...(addr.city ? { addressLocality: addr.city } : {}),
          ...(addr.state ? { addressRegion: addr.state } : {}),
          ...(addr.formated_address ? { name: addr.formated_address } : {}),
        }
      : null;

  // The artist's disciplines/styles — what this professional is known for.
  const knowsAbout = (profile.categories ?? [])
    .map((c) => c.name)
    .filter(Boolean);

  // Verified external profiles for this artist — strengthens entity disambiguation.
  const sameAs = [
    profile.instagram_link,
    profile.facebook_link,
    profile.youtube_link,
    profile.website_link,
  ].filter((link): link is string => Boolean(link));

  // High commercial-intent surface: expose the artist's services as offerings.
  const makesOffer = services.map((s) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: s.title,
      url: `${serverEnv.APP_URL}/artists/${profile.username}/services/${s.slug}`,
    },
    ...(s.show_price && s.price != null
      ? { price: s.price.toFixed(2), priceCurrency: PLATFORM_CURRENCY }
      : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonical,
    mainEntity: {
      "@type": "Person",
      name,
      alternateName: `@${profile.username}`,
      url: canonical,
      ...(profile.profession ? { jobTitle: profile.profession } : {}),
      ...(profile.avatar ? { image: profile.avatar } : {}),
      ...(profile.short_biography
        ? { description: profile.short_biography }
        : {}),
      ...(knowsAbout.length ? { knowsAbout } : {}),
      ...(address ? { address } : {}),
      ...(profile.phone_number ? { telephone: profile.phone_number } : {}),
      ...(makesOffer.length ? { makesOffer } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
  };
};

const ArtistHomePage = async ({ params }: Props) => {
  const { username } = await params;
  const [{ data: profile }, { data: services }, t] = await Promise.all([
    UserService.getProfile(username),
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
  const jsonLd = buildProfileJsonLd(profile, services ?? []);

  // Answer-shaped TL;DR (GEO §G2): a concise, structured summary AI engines and search can lift.
  // Built from profession + locality — deliberately NOT the short bio, which is already shown below
  // as an editorial pull-quote; this complements it rather than duplicating it.
  const profession = profile.profession?.trim();
  const locality = profile.address?.city?.trim() || profile.address?.state?.trim();
  const summary =
    profession && locality
      ? t("summaryProfessionLocation", {
          name: heading,
          profession,
          location: locality,
        })
      : profession
        ? t("summaryProfession", { name: heading, profession })
        : locality
          ? t("summaryLocation", { name: heading, location: locality })
          : t("summaryFallback", { name: heading });

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-1000">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is escaped (`<` -> \u003c) to prevent XSS.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero Banner — full-bleed up to desktop */}
      <section className="relative w-full" aria-label="Profile banner">
        <div className="relative h-[30vh] w-full tablet:h-[38vh] laptop:h-[42vh] desktop:h-[46vh]">
          <Image
            alt={`${heading}'s banner`}
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
                alt={`${heading}'s avatar`}
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
          {profile.profession && (
            <p className="text-sm tracking-wide text-text-muted tablet:text-base">
              {profile.profession}
            </p>
          )}
          {fullName && <p className=" text-text">@{profile.username}</p>}
        </div>

        {summary && (
          <p className="max-w-xl text-sm leading-relaxed text-text-muted tablet:text-base">
            {summary}
          </p>
        )}

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
            {profile.instagram_link && (
              <a
                href={profile.instagram_link}
                target="_blank"
                rel="noreferrer noopener"
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
                rel="noreferrer noopener"
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
                rel="noreferrer noopener"
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
                rel="noreferrer noopener"
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
          aria-label="About"
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
