'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMainNav } from "../providers/main-nav.provider"
import { ReactNode, useEffect, useState } from "react";
import { Box, Grid, Home, Info, LayoutDashboard, Settings } from "lucide-react";
import { LogoutDialog } from "@/app/(atelier)/__components/logout-dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

const routes: {
    name: string,
    url: string,
    matches?: string[],
    icon: ReactNode
}[] = [
        {
            name: 'Dashboard',
            url: '',
            icon: <LayoutDashboard size={20} />
        },
        {
            name: 'Home',
            url: 'home',
            icon: <Home size={20} />
        },
        {
            name: 'Media',
            url: 'media',
            icon: <Box size={20} />
        },
        {
            name: 'Portfolios',
            url: 'portfolio',
            icon: <Grid size={20} />
        },
        {
            name: 'About',
            url: 'about',
            icon: <Info size={20} />
        },
        {
            name: 'Settings',
            url: 'settings',
            icon: <Settings size={20} />
        }
    ]

export const MainNav = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
    const [isClient, setIsClient] = useState(false)
    const pathname = usePathname();
    const { shrinked } = useMainNav();
    const isShrinked = forceExpanded ? false : shrinked;

    useEffect(() => { setIsClient(true) }, [])

    if (!isClient) return <Spinner />

    return (
        <div className="flex flex-col items-start w-full justify-between h-full">
            <nav className="flex flex-col gap-2 w-full px-2">
                {routes.map((route) => {
                    const url = `/atelier${!route.url ? "" : '/'}${route.url}`
                    const isActive = pathname === url || route.matches?.some(match => pathname == `/atelier/${match}`);
                    return (
                        <Link
                            key={route.url}
                            href={url}
                            title={isShrinked ? route.name : undefined}
                            className={`text-sm flex items-center gap-3 rounded-md transition-colors duration-200
                                ${isShrinked ? 'justify-center px-2 py-2' : 'px-3 py-2'}
                                ${isActive
                                    ? 'bg-text text-bg'
                                    : 'hover:bg-fg-2'
                                }
                            `}
                        >
                            <span className="shrink-0">{route.icon}</span>
                            {!isShrinked && <span className="truncate">{route.name}</span>}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-t-fg-2 w-full flex items-center justify-center px-2 py-2">
                <LogoutDialog />
            </div>
        </div>
    );
}