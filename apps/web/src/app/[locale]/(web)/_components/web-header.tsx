"use client";

import { BrandLogo } from "@repo/ui/components/custom/brand-logo";
import { Button } from "@repo/ui/components/shadcn/button";
import {
 Drawer,
 DrawerClose,
 DrawerContent,
 DrawerTitle,
 DrawerTrigger,
} from "@repo/ui/components/shadcn/drawer";
import { cn } from "@repo/ui/lib/utils";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserAuth } from "@/modules/auth/auth.types";
import { WebHeaderArtistSearch } from "./web-header-artist-search";

interface WebHeaderProps {
 session: UserAuth | null;
}

export const WebHeader = ({ session }: WebHeaderProps) => {
 const pathname = usePathname();
 const [scrolled, setScrolled] = useState(false);
 const [drawerOpen, setDrawerOpen] = useState(false);
 const [isMounted, setIsMounted] = useState(false);

 useEffect(() => {
 const handleScroll = () => setScrolled(window.scrollY > 20);
 window.addEventListener("scroll", handleScroll);
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 useEffect(() => {
 setDrawerOpen(false);
 }, []);

 useEffect(() => {
 setIsMounted(true);
 }, []);

 const isLoginPage = pathname === "/auth/login";
 const isRegisterPage = pathname?.startsWith("/auth/register");
 const isAuthenticated = !!session;

 return (
 <header
 className={cn(
 "fixed top-0 left-0 right-0 z-50 flex items-center justify-center border-b transition-all duration-300 bg-bg",
 scrolled
 ? "border-b-fg-2/50 bg-transparent hover:bg-bg opacity-60 backdrop-blur-sm hover:opacity-100 hover:border-b-fg-2"
 : "border-b-fg-2 opacity-100",
 )}
 >
 <div className="max-w-(--screen-desktop) w-full h-16 flex items-center justify-between gap-3 px-5 tablet:gap-4 tablet:px-10">
 <Link
 href="/"
 className="shrink-0 text-text hover:opacity-80 transition-opacity"
 >
 <BrandLogo />
 </Link>

 <WebHeaderArtistSearch className="hidden min-w-0 flex-1 max-w-lg tablet:block" />

 <nav className="hidden shrink-0 tablet:flex items-center gap-8">
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
 <Button asChild variant="primary" size="sm">
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
 <Button asChild variant="primary" size="sm">
 <Link href="/auth/register">
 Get Started
 <ArrowRight className="size-3.5" />
 </Link>
 </Button>
 )}
 </>
 )}
 </nav>

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

 <DrawerContent className="inset-y-0 left-0 right-0 w-full h-full mt-0 border-0 bg-bg [&>div:first-child]:hidden">
 <DrawerTitle className="sr-only">Navigation</DrawerTitle>

 <div className="flex items-center justify-between h-16 px-5 border-b border-fg-2">
 <Link
 href="/"
 onClick={() => setDrawerOpen(false)}
 className="text-text hover:opacity-80 transition-opacity"
 >
 <BrandLogo />
 </Link>
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

 <div className="flex flex-col flex-1 overflow-y-auto">
 <div className="px-5 pt-6 pb-4">
 <WebHeaderArtistSearch />
 </div>

 <div className="px-5 pt-4">
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
 variant="primary"
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
 <Button
 asChild
 variant="base"
 size="lg"
 className="w-full"
 >
 <Link href="/auth/login">Sign in</Link>
 </Button>
 <Button
 asChild
 variant="primary"
 size="lg"
 className="w-full"
 >
 <Link href="/auth/register">Get Started</Link>
 </Button>
 </div>
 )}
 </div>
 </div>

 <div className="mt-auto px-5 py-6 border-t border-fg-2">
 <p className="text-xs tracking-wider text-text-muted leading-relaxed">
 The portfolio platform built for artists.
 </p>
 </div>
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
