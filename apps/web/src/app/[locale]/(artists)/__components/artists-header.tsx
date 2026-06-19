"use client";

import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { useShare } from "@repo/ui/hooks/useShare";
import { cn } from "@repo/ui/lib/utils";
import { Check, Menu, Share2, X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/hooks/useSession";
import { ArtistContactDialog } from "./artist-contact.dialog";

export const ArtistsHeader = () => {
  const pathname = usePathname();
  const params = useParams();
  const username = params.username as string;
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { share, active: shareActive } = useShare({ fallbackCopy: true });
  const { session, isLoading: sessionLoading } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { label: `@${username}`, href: `/artists/${username}` },
    { label: "Portfolios", href: `/artists/${username}/portfolios` },
    { label: "Collections", href: `/artists/${username}/collections` },
    { label: "Services", href: `/artists/${username}/services` },
    { label: "About", href: `/artists/${username}/about` },
  ];

  const isActive = (href: string) =>
    href === `/artists/${username}`
      ? pathname === href
      : pathname?.startsWith(href);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center border-b transition-all duration-300 bg-bg",
        scrolled
          ? "border-b-fg-2/50 bg-transparent hover:bg-bg opacity-60 backdrop-blur-sm hover:opacity-100 hover:border-b-fg-2"
          : "border-b-fg-2 opacity-100",
      )}
    >
      <div className="max-w-(--screen-desktop) w-full h-16 flex items-center justify-between px-5 tablet:px-10">
        <div className="flex items-center gap-3 tablet:gap-4 min-w-0">
          <Link
            href="/"
            className="text-text hover:opacity-80 transition-opacity shrink-0"
          >
            <BrandLogo />
          </Link>
          {!sessionLoading && session ? (
            <Link
              href="/atelier"
              className="text-xs tracking-wider text-text-muted/45 hover:text-text-muted/90 transition-colors font-medium shrink-0 border-l border-fg-2/25 pl-3 tablet:pl-4"
            >
              Atelier
            </Link>
          ) : null}
        </div>

        {/* Desktop navigation */}
        <nav className="hidden tablet:flex items-center gap-8">
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
          {isMounted ? (
            <ArtistContactDialog>
              <button
                type="button"
                className="text-sm tracking-wider transition-colors hover:text-text font-medium text-text-muted"
              >
                Contact
              </button>
            </ArtistContactDialog>
          ) : (
            <button
              type="button"
              className="text-sm tracking-wider transition-colors hover:text-text font-medium text-text-muted"
            >
              Contact
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              share({ url: window.location.href, title: `@${username}` })
            }
            className="text-text-muted hover:text-text transition-colors cursor-pointer"
            aria-label={shareActive ? "Shared" : "Share profile"}
          >
            {shareActive ? (
              <Check className="size-4" strokeWidth={2} />
            ) : (
              <Share2 className="size-4" strokeWidth={2} />
            )}
          </button>
        </nav>

        {/* Mobile hamburger */}
        {isMounted ? (
          <Drawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            direction="right"
          >
            <DrawerTrigger asChild>
              <button
                type="button"
                className="tablet:hidden flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
            </DrawerTrigger>

            <DrawerContent className="inset-y-0 left-auto right-0 w-72 h-full mt-0 border-0 border-l border-fg-2 bg-bg [&>div:first-child]:hidden">
              <DrawerTitle className="sr-only">Navigation</DrawerTitle>

              <div className="flex items-center justify-between h-16 px-6 border-b border-fg-2">
                <span className="text-sm font-medium tracking-wider text-text-muted">
                  Menu
                </span>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
                    aria-label="Close navigation"
                  >
                    <X className="size-5" />
                  </button>
                </DrawerClose>
              </div>

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
                    Contact
                  </button>
                </ArtistContactDialog>
                <button
                  type="button"
                  onClick={() =>
                    share({ url: window.location.href, title: `@${username}` })
                  }
                  className="flex items-center gap-2 cursor-pointer text-sm tracking-wider font-medium py-3 transition-colors hover:text-text text-text-muted text-left"
                  aria-label={shareActive ? "Shared" : "Share profile"}
                >
                  {shareActive ? (
                    <>
                      <Check className="size-4" strokeWidth={2} /> Shared
                    </>
                  ) : (
                    <>
                      <Share2 className="size-4" strokeWidth={2} /> Share
                    </>
                  )}
                </button>
              </nav>
            </DrawerContent>
          </Drawer>
        ) : (
          <button
            type="button"
            className="tablet:hidden flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
};
