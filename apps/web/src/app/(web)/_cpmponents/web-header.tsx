'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ArrowRight } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerTitle,
    DrawerClose,
} from "@repo/ui/components/shadcn/drawer"
import { Button } from "@repo/ui/components/shadcn/button"
import { BrandLogo } from "@repo/ui/components/custom/brand-logo"
import { UserAuth } from "@/modules/auth/auth.types"

interface WebHeaderProps {
    session: UserAuth | null
}

export const WebHeader = ({ session }: WebHeaderProps) => {
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setDrawerOpen(false)
    }, [pathname])

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const isLoginPage = pathname === '/auth/login'
    const isRegisterPage = pathname?.startsWith('/auth/register')
    const isAuthenticated = !!session

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 flex items-center justify-center border-b transition-all duration-300 bg-bg",
                scrolled
                    ? "border-b-fg-2/50 bg-transparent hover:bg-bg opacity-60 backdrop-blur-sm hover:opacity-100 hover:border-b-fg-2"
                    : "border-b-fg-2 opacity-100"
            )}
        >
            <div className="max-w-(--screen-desktop) w-full h-16 flex items-center justify-between px-5 tablet:px-10">
                <Link
                    href="/"
                    className="text-text hover:opacity-80 transition-opacity"
                >
                    <BrandLogo />
                </Link>

                <nav className="hidden tablet:flex items-center gap-8">
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
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
                        <DrawerTrigger asChild>
                            <button
                                className="tablet:hidden flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
                                aria-label="Open navigation"
                            >
                                <Menu className="size-5" />
                            </button>
                        </DrawerTrigger>

                        <DrawerContent
                            className="inset-y-0 left-auto right-0 w-72 h-full mt-0 rounded-none border-0 border-l border-fg-2 bg-bg [&>div:first-child]:hidden"
                        >
                            <DrawerTitle className="sr-only">Navigation</DrawerTitle>

                            <div className="flex items-center justify-between h-16 px-6 border-b border-fg-2">
                                <span className="text-sm font-medium tracking-wider text-text-muted">
                                    Menu
                                </span>
                                <DrawerClose asChild>
                                    <button
                                        className="flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
                                        aria-label="Close navigation"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </DrawerClose>
                            </div>

                            <nav className="flex flex-col px-6 py-6 gap-1">
                                {isAuthenticated ? (
                                    <>
                                        {session?.username && (
                                            <Link
                                                href={`/artists/${session.username}`}
                                                className="text-sm tracking-wider font-medium py-3 transition-colors text-text-muted hover:text-text"
                                            >
                                                Access Profile
                                            </Link>
                                        )}
                                        <Link
                                            href="/atelier"
                                            className="text-sm tracking-wider font-medium py-3 transition-colors text-text-muted hover:text-text flex items-center gap-2"
                                        >
                                            Go to Atelier
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {!isLoginPage && (
                                            <Link
                                                href="/auth/login"
                                                className="text-sm tracking-wider font-medium py-3 transition-colors text-text-muted hover:text-text"
                                            >
                                                Sign in
                                            </Link>
                                        )}
                                        {!isRegisterPage && (
                                            <Link
                                                href="/auth/register"
                                                className="text-sm tracking-wider font-medium py-3 transition-colors text-text-muted hover:text-text"
                                            >
                                                Get Started
                                            </Link>
                                        )}
                                    </>
                                )}
                            </nav>

                            <div className="mt-auto px-6 py-6 border-t border-fg-2">
                                <p className="text-xs tracking-wider text-accent-muted leading-relaxed">
                                    The portfolio platform built for artists.
                                </p>
                            </div>
                        </DrawerContent>
                    </Drawer>
                ) : (
                    <button
                        className="tablet:hidden flex items-center justify-center size-10 text-text hover:opacity-80 transition-opacity"
                        aria-label="Open navigation"
                    >
                        <Menu className="size-5" />
                    </button>
                )}
            </div>
        </header>
    )
}
