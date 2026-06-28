"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/lib/components/site-header";
import type { UserAuth } from "@/modules/auth/auth.types";
import { WebHeaderArtistSearch } from "./web-header-artist-search";

interface WebHeaderProps {
  session: UserAuth | null;
}

export const WebHeader = ({ session }: WebHeaderProps) => {
  const pathname = usePathname();

  const isLoginPage = pathname === "/auth/login";
  const isRegisterPage = pathname?.startsWith("/auth/register");
  const isAuthenticated = !!session;

  return (
    <SiteHeader variant="web">
      <SiteHeader.Bar className="gap-3 tablet:gap-4">
        <SiteHeader.Logo />

        <WebHeaderArtistSearch className="min-w-0 flex-1 max-w-lg" />

        <SiteHeader.Actions>
          {isAuthenticated ? (
            <>
              {session?.username && (
                <Link
                  href={`/artists/${session.username}`}
                  className="text-sm tracking-wider font-medium transition-colors text-text-muted hover:text-text"
                >
                  Access Profile
                </Link>
              )}
              <Button asChild variant="accent" size="sm">
                <Link href="/atelier">
                  Go to Atelier
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
                  Sign in
                </Link>
              )}
              {!isRegisterPage && (
                <Button asChild variant="accent" size="sm">
                  <Link href="/auth/register">
                    Get Started
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              )}
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
                        Access Profile
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
                      Open Atelier
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="base" size="lg" className="w-full">
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="accent" size="lg" className="w-full">
                    <Link href="/auth/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </SiteHeader.MobileDrawerBody>

          <SiteHeader.MobileDrawerFooter className="px-5 py-6">
            <p className="text-xs tracking-wider text-text-muted leading-relaxed">
              The portfolio platform built for artists.
            </p>
          </SiteHeader.MobileDrawerFooter>
        </SiteHeader.MobileMenu>
      </SiteHeader.Bar>
    </SiteHeader>
  );
};
