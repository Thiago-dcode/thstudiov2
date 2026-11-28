"use client";
import {
  artistAboutPath,
  artistListPath,
  artistPath,
} from "@repo/common-lib/utils/artist-path";
import { EDITORIAL_LABEL_CLASS } from "@repo/ui/components/custom/editorial";
import { ShareButton } from "@repo/ui/components/custom/share-button";
import { cn } from "@repo/ui/lib/utils";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { SiteHeader, useSiteHeader } from "@/lib/components/site-header";
import { useAppStatus } from "@/lib/providers/app-status.provider";
import { useSession } from "@/lib/providers/session.provider";
import { ArtistSearch } from "@/modules/users/components/artist-search";
import { useArtist } from "@/modules/users/providers/artist.provider";
import { ArtistContactDialog } from "./artist-contact.dialog";

const DRAWER_LINK_CLASS =
  "flex min-h-11 items-center text-sm font-medium tracking-wider transition-colors hover:text-text";

const drawerLinkClass = (active = false) =>
  cn(DRAWER_LINK_CLASS, active ? "text-text" : "text-text-muted");

/** The drawer's A11STUDIO part. Signed in: back to the atelier. Signed out: sign in / sign up. */
function A11studioLinks() {
  const { session } = useSession();
  const { closeDrawer } = useSiteHeader();
  // Despite the name, `true` means registration is open (see RegistrationCtaButton).
  const { isRegisterClose } = useAppStatus();
  const t = useTranslations("artists.header");
  const tInvite = useTranslations("artists.invite");

  if (session) {
    return (
      <Link href="/atelier" className={drawerLinkClass()}>
        {t("atelier")}
      </Link>
    );
  }

  return (
    <>
      <Link href="/auth/login" className={drawerLinkClass()}>
        {t("signIn")}
      </Link>
      {/* Registration closed: the wait-list dialog instead of the sign-up page. */}
      <RegistrationCtaButton
        variant="link"
        size="sm"
        invitePlacement="header"
        onNavigate={closeDrawer}
        label={isRegisterClose ? t("signUp") : tInvite("ctaWaitlist")}
        className={cn(
          drawerLinkClass(),
          "h-auto justify-start gap-2 px-0 py-0 hover:no-underline",
        )}
      />
    </>
  );
}

export const ArtistsHeader = () => {
  const pathname = usePathname();
  const params = useParams();
  // `sections` is null when the profile didn't load: no section links at all.
  const { artist, sections } = useArtist();
  // The URL segment is the fallback for a segment with no profile (e.g. a 404 under this layout).
  const username = artist?.username ?? (params.username as string);
  const t = useTranslations("artists.header");
  const tShare = useTranslations("artists");

  const profileHref = artistPath(username);
  // Only sections with something to show: a hidden link disappears, it is never greyed out.
  // Derived from server-provided data alone (not the session or `isMounted`), so SSR and hydration agree.
  const sectionItems = [
    {
      label: t("nav.portfolios"),
      href: artistListPath(username, "portfolios"),
      visible: (sections?.portfoliosActiveCount ?? 0) > 0,
    },
    {
      label: t("nav.collections"),
      href: artistListPath(username, "collections"),
      visible: (sections?.collectionsActiveCount ?? 0) > 0,
    },
    {
      label: t("nav.services"),
      href: artistListPath(username, "services"),
      visible: (sections?.servicesActiveCount ?? 0) > 0,
    },
    {
      label: t("nav.about"),
      href: artistAboutPath(username),
      visible: sections?.has_about_page === true,
    },
  ].filter((item) => item.visible);
  const artistItems = [
    { label: t("nav.profile"), href: profileHref },
    ...sectionItems,
  ];

  const isActive = (href: string) =>
    href === profileHref ? pathname === href : !!pathname?.startsWith(href);

  return (
    <SiteHeader variant="artist">
      <SiteHeader.Bar className="gap-4">
        <SiteHeader.Logo />

        {/* Tablet up, in the bar like the web header. On phones it lives in the burger. */}
        <ArtistSearch className="hidden min-w-0 flex-1 max-w-lg tablet:block" />

        {/* Right side, every width: the way back to the artist's profile, share and the burger.
            Everything else lives in the drawer. The username truncates; the controls never shrink. */}
        <div className="flex min-w-0 items-center gap-1 tablet:gap-2">
          <Link
            href={profileHref}
            aria-current={isActive(profileHref) ? "page" : undefined}
            className="flex min-h-11 min-w-0 items-center px-2 text-sm font-medium tracking-wider text-text transition-opacity hover:opacity-70"
          >
            <span className="truncate">@{username}</span>
          </Link>

          <SiteHeader.MobileControls className="tablet:flex tablet:gap-2">
            <ShareButton
              title={`@${username}`}
              ariaLabel={tShare("shareProfile")}
              className="flex items-center justify-center size-10 shrink-0"
            />

            <SiteHeader.MobileMenu
              triggerClassName="tablet:flex"
              contentClassName="inset-y-0 left-auto right-0 w-72 tablet:w-80 h-full border-l border-fg-2"
            >
              <SiteHeader.MobileDrawerBar className="px-6">
                <span className="text-sm font-medium tracking-wider text-text-muted">
                  {t("menu")}
                </span>
              </SiteHeader.MobileDrawerBar>

              <SiteHeader.MobileDrawerBody>
                <nav
                  aria-label={`@${username}`}
                  className="flex flex-col px-6 pt-8 pb-6"
                >
                  {/* `normal-case`: the label style is uppercase, a username is not. */}
                  <h2
                    className={cn(
                      EDITORIAL_LABEL_CLASS,
                      "mb-3 truncate normal-case",
                    )}
                  >
                    @{username}
                  </h2>
                  {artistItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={drawerLinkClass(isActive(item.href))}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <ArtistContactDialog>
                    <button
                      type="button"
                      className={cn(
                        drawerLinkClass(),
                        "cursor-pointer text-left",
                      )}
                    >
                      {t("contact")}
                    </button>
                  </ArtistContactDialog>
                </nav>

                <hr className="mx-6 border-fg-2" />

                <nav
                  aria-label="A11STUDIO"
                  className="flex flex-col px-6 pt-6 pb-8"
                >
                  <h2 className={cn(EDITORIAL_LABEL_CLASS, "mb-3")}>
                    A11STUDIO
                  </h2>
                  {/* Phones only: from tablet up the search sits in the bar. */}
                  <div className="mb-2 tablet:hidden">
                    <ArtistSearch />
                  </div>
                  <A11studioLinks />
                </nav>
              </SiteHeader.MobileDrawerBody>
            </SiteHeader.MobileMenu>
          </SiteHeader.MobileControls>
        </div>
      </SiteHeader.Bar>
    </SiteHeader>
  );
};
