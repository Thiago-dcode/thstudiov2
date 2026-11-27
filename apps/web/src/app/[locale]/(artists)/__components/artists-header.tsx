"use client";

import { ShareButton } from "@repo/ui/components/custom/share-button";
import { cn } from "@repo/ui/lib/utils";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { SiteHeader, useSiteHeader } from "@/lib/components/site-header";
import { useAppStatus } from "@/lib/providers/app-status.provider";
import { useSession } from "@/lib/providers/session.provider";
import { ArtistContactDialog } from "./artist-contact.dialog";

function ArtistsHeaderContactAction() {
  const { isMounted } = useSiteHeader();
  const t = useTranslations("artists.header");

  if (!isMounted) {
    return (
      <button
        type="button"
        className="text-sm tracking-wider transition-colors hover:text-text font-medium text-text-muted"
      >
        {t("contact")}
      </button>
    );
  }

  return (
    <ArtistContactDialog>
      <button
        type="button"
        className="text-sm tracking-wider transition-colors hover:text-text font-medium text-text-muted"
      >
        {t("contact")}
      </button>
    </ArtistContactDialog>
  );
}

/** Signed in: the way back to the atelier. Signed out: the quiet invite to make your own page. */
function AtelierOrInvite({ className }: { className?: string }) {
  const { session } = useSession();
  // Despite the name, `true` means registration is open (see RegistrationCtaButton).
  const { isRegisterClose } = useAppStatus();
  const t = useTranslations("artists.header");
  const tInvite = useTranslations("artists.invite");

  return session ? (
    <Link
      href="/atelier"
      className={cn(
        "flex min-h-11 shrink-0 items-center text-xs font-medium tracking-wider text-text-muted/45 transition-colors hover:text-text-muted/90",
        className,
      )}
    >
      {t("atelier")}
    </Link>
  ) : (
    // One step more legible than the atelier link: visible enough to be found, quiet enough to
    // stay behind the artist's name and work.
    <RegistrationCtaButton
      variant="link"
      size="sm"
      invitePlacement="header"
      label={isRegisterClose ? t("createYours") : tInvite("ctaWaitlist")}
      className={cn(
        "min-h-11 shrink-0 px-0 py-0 text-xs font-medium tracking-wider text-text-muted transition-colors hover:text-text",
        className,
      )}
    />
  );
}

export const ArtistsHeader = () => {
  const pathname = usePathname();
  const params = useParams();
  const username = params.username as string;
  const t = useTranslations("artists.header");
  const tShare = useTranslations("artists");

  const profileHref = `/artists/${username}`;
  const sectionItems = [
    { label: t("nav.portfolios"), href: `${profileHref}/portfolios` },
    { label: t("nav.collections"), href: `${profileHref}/collections` },
    { label: t("nav.services"), href: `${profileHref}/services` },
    { label: t("nav.about"), href: `${profileHref}/about` },
  ];
  const navItems = [
    { label: `@${username}`, href: profileHref },
    ...sectionItems,
  ];

  const isActive = (href: string) =>
    href === profileHref ? pathname === href : pathname?.startsWith(href);

  return (
    <SiteHeader variant="artist">
      <SiteHeader.Bar>
        <div className="flex items-center gap-3 tablet:gap-4 min-w-0">
          <SiteHeader.Logo />
          {/* Mobile: the slot next to the logo is the way back to the artist's profile, always in
              reach instead of buried in the drawer. Atelier / the invite move into the drawer. */}
          <Link
            href={profileHref}
            aria-current={isActive(profileHref) ? "page" : undefined}
            className="tablet:hidden flex min-h-11 min-w-0 items-center border-l border-fg-2/25 pl-3 text-sm font-medium tracking-wider text-text transition-opacity hover:opacity-70"
          >
            <span className="truncate">@{username}</span>
          </Link>
          <div className="hidden tablet:flex items-center">
            <AtelierOrInvite className="border-l border-fg-2/25 pl-4" />
          </div>
        </div>

        <SiteHeader.Actions>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm tracking-wider transition-colors hover:text-text font-medium",
                isActive(item.href) ? "text-text" : "text-text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
          <ArtistsHeaderContactAction />
          <ShareButton
            title={`@${username}`}
            ariaLabel={tShare("shareProfile")}
          />
        </SiteHeader.Actions>

        <SiteHeader.MobileControls>
          <ShareButton
            title={`@${username}`}
            ariaLabel={tShare("shareProfile")}
            className="flex items-center justify-center size-10 shrink-0"
          />

          <SiteHeader.MobileMenu contentClassName="inset-y-0 left-auto right-0 w-72 h-full border-l border-fg-2">
            <SiteHeader.MobileDrawerBar className="px-6">
              <span className="text-sm font-medium tracking-wider text-text-muted">
                {t("menu")}
              </span>
            </SiteHeader.MobileDrawerBar>

            <nav className="flex flex-col px-6 py-6 gap-1">
              {sectionItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "text-sm tracking-wider font-medium py-3 transition-colors hover:text-text",
                    isActive(item.href) ? "text-text" : "text-text-muted",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <ArtistContactDialog>
                <button
                  type="button"
                  className="cursor-pointer text-sm tracking-wider font-medium py-3 transition-colors hover:text-text text-text-muted text-left"
                >
                  {t("contact")}
                </button>
              </ArtistContactDialog>
            </nav>
            <div className="mx-6 border-t border-fg-2 pt-4">
              <AtelierOrInvite />
            </div>
          </SiteHeader.MobileMenu>
        </SiteHeader.MobileControls>
      </SiteHeader.Bar>
    </SiteHeader>
  );
};
