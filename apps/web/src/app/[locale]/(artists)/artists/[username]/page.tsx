import type { UserProfile } from "@repo/common-lib/types/user";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import { serverEnv } from "@/env/server";
import UserService from "@/modules/users/users.service";
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
    return {
      title: "Artist not found",
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
  const ogImage = profile.banner || profile.avatar || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      ...(ogImage ? { images: [{ url: ogImage, alt: name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

const buildProfileJsonLd = (profile: UserProfile) => {
  const name = displayName(profile);
  const canonical = canonicalUrl(profile.username);

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
      ...(profile.address?.formated_address
        ? {
            address: {
              "@type": "PostalAddress",
              name: profile.address.formated_address,
            },
          }
        : {}),
    },
  };
};

const ArtistHomePage = async ({ params }: Props) => {
  const { username } = await params;
  const { data: profile } = await UserService.getProfile(username);

  if (!profile) {
    notFound();
  }

  const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");
  const heading = fullName || `@${profile.username}`;
  const jsonLd = buildProfileJsonLd(profile);

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
          <div className="relative size-32 overflow-hidden bg-fg-1 shadow-2xl ring-[5px] ring-bg tablet:size-36 laptop:size-40 rounded-full!">
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
                <span className="font-serif text-5xl italic text-text-muted/50">
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
              <span>Get in touch</span>
            </button>
          </ArtistContactDialog>

          <Link
            href={`/artists/${profile.username}/about`}
            className="group inline-flex min-h-11 items-center gap-2.5 border border-border/50 px-7 py-3 text-xs tracking-[0.15em] text-text-muted uppercase transition-all duration-300 hover:border-text/30 hover:text-text"
          >
            <span>About {heading}</span>
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* Short Biography — editorial pull-quote */}
      {profile.short_biography && (
        <section className="mx-auto w-full px-6 pb-20" aria-label="About">
          <div className="relative py-8">
            <blockquote className="mx-auto w-full text-center font-serif text-base leading-[1.9] text-text-muted italic tablet:text-lg">
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
