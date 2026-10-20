"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { RegistrationCtaButton } from "@/lib/components/registration-cta-button";
import { SiteHeader, useSiteHeader } from "@/lib/components/site-header";
import type { UserAuth } from "@/modules/auth/auth.types";
import { WebHeaderArtistSearch } from "./web-header-artist-search";

interface WebHeaderProps {
  session: UserAuth | null;
  /** The artist search queries the directory, so it is hidden while the directory is closed. */
  showSearch: boolean;
}

function DrawerRegistrationCtaButton() {
  const { closeDrawer } = useSiteHeader();

  return (
    <RegistrationCtaButton
      size="lg"
      className="w-full"
      onNavigate={closeDrawer}
    />
  );
}

export const WebHeader = ({ session, showSearch }: WebHeaderProps) => {
  const t = useTranslations("webHeader");
  const pathname = usePathname();

  const isLoginPage = pathname === "/auth/login";
  const isRegisterPage = pathname?.startsWith("/auth/register");
  const isAuthenticated = !!session;

  return (
    <SiteHeader variant="web">
      <SiteHeader.Bar className="gap-3 tablet:gap-4">
        <SiteHeader.Logo />

        {showSearch ? (
          <WebHeaderArtistSearch className="min-w-0 flex-1 max-w-lg" />
        ) : (
          // Holds the search's place so the logo and the actions keep their positions.
          <div aria-hidden="true" className="flex-1" />
        )}

        <SiteHeader.Actions>
          {isAuthenticated ? (
            <>
              {session?.username && (
                <Link
                  href={`/artists/${session.username}`}
                  className="text-sm tracking-wider font-medium transition-colors text-text-muted hover:text-text"
                >
                  {t("accessProfile")}
                </Link>
              )}
              <Button asChild variant="default" size="sm">
                <Link href="/atelier">
                  {t("goToAtelier")}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              {!isLoginPage && (
                <Link
                  href="/auth/login"
                  className="text-sm tracking-wider font-medium transition-colors text-text-muted hover:text-text"
                >
                  {t("signIn")}
                </Link>
              )}
              {!isRegisterPage && <RegistrationCtaButton size="sm" />}
            </>
          )}
        </SiteHeader.Actions>

        <SiteHeader.MobileMenu contentClassName="inset-y-0 left-0 right-0 w-full h-full">
          <SiteHeader.MobileDrawerBar className="px-5">
            <SiteHeader.Logo closeOnClick />
          </SiteHeader.MobileDrawerBar>

          <SiteHeader.MobileDrawerBody>
            <div className="px-5 pt-6">
              {isAuthenticated ? (
                <div className="grid gap-3">
                  {session?.username && (
                    <Button
                      asChild
                      variant="base"
                      size="lg"
                      className="w-full justify-between"
                    >
                      <Link href={`/artists/${session.username}`}>
                        {t("accessProfile")}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="accent"
                    size="lg"
                    className="w-full justify-between"
                  >
                    <Link href="/atelier">
                      {t("openAtelier")}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="base" size="lg" className="w-full">
                    <Link href="/auth/login">{t("signIn")}</Link>
                  </Button>
                  <DrawerRegistrationCtaButton />
                </div>
              )}
            </div>
          </SiteHeader.MobileDrawerBody>

          <SiteHeader.MobileDrawerFooter className="px-5 py-6">
            <p className="text-xs tracking-wider text-text-muted leading-relaxed">
              {t("tagline")}
            </p>
          </SiteHeader.MobileDrawerFooter>
        </SiteHeader.MobileMenu>
      </SiteHeader.Bar>
    </SiteHeader>
  );
};
