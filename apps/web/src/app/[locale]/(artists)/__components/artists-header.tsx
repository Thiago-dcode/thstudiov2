"use client";

import { ShareButton } from "@repo/ui/components/custom/share-button";
import { cn } from "@repo/ui/lib/utils";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SiteHeader, useSiteHeader } from "@/lib/components/site-header";
import { useSession } from "@/lib/hooks/useSession";
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

/** `shareReady` comes from the layout: an incomplete profile gets no share affordance. */
export const ArtistsHeader = ({ shareReady }: { shareReady: boolean }) => {
  const pathname = usePathname();
  const params = useParams();
  const username = params.username as string;
  const { session, isLoading: sessionLoading } = useSession();
  const t = useTranslations("artists.header");
  const tShare = useTranslations("artists");

  const navItems = [
    { label: `@${username}`, href: `/artists/${username}` },
    { label: t("nav.portfolios"), href: `/artists/${username}/portfolios` },
    { label: t("nav.collections"), href: `/artists/${username}/collections` },
    { label: t("nav.services"), href: `/artists/${username}/services` },
    { label: t("nav.about"), href: `/artists/${username}/about` },
  ];

  const isActive = (href: string) =>
    href === `/artists/${username}`
      ? pathname === href
      : pathname?.startsWith(href);

  return (
    <SiteHeader variant="artist">
      <SiteHeader.Bar>
        <div className="flex items-center gap-3 tablet:gap-4 min-w-0">
          <SiteHeader.Logo />
          {!sessionLoading && session ? (
            <Link
              href="/atelier"
              className="text-xs tracking-wider text-text-muted/45 hover:text-text-muted/90 transition-colors font-medium shrink-0 border-l border-fg-2/25 pl-3 tablet:pl-4"
            >
              {t("atelier")}
            </Link>
          ) : null}
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
          {shareReady && (
            <ShareButton
              title={`@${username}`}
              ariaLabel={tShare("shareProfile")}
            />
          )}
        </SiteHeader.Actions>

        <SiteHeader.MobileControls>
          {shareReady && (
            <ShareButton
              title={`@${username}`}
              ariaLabel={tShare("shareProfile")}
              className="flex items-center justify-center size-10 shrink-0"
            />
          )}

          <SiteHeader.MobileMenu contentClassName="inset-y-0 left-auto right-0 w-72 h-full border-l border-fg-2">
            <SiteHeader.MobileDrawerBar className="px-6">
              <span className="text-sm font-medium tracking-wider text-text-muted">
                {t("menu")}
              </span>
            </SiteHeader.MobileDrawerBar>

            <nav className="flex flex-col px-6 py-6 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
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
          </SiteHeader.MobileMenu>
        </SiteHeader.MobileControls>
      </SiteHeader.Bar>
    </SiteHeader>
  );
};
