'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMainNav } from "../providers/main-nav.provider"
import { ReactNode } from "react";
import { Box, Grid, Home, Settings } from "lucide-react";
import { Logout } from "@/app/(admin)/__components/logout";

const routes: {
    name: string,
    url: string,
    icon: ReactNode
}[] = [
        {
            name: 'Dashboard',
            url: '',
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
            name: 'Settings',
            url: 'settings',
            icon: <Settings size={20} />
        }
    ]

export const MainNav = () => {
    const pathname = usePathname();
    console.log(pathname);
    const { shrinked } = useMainNav();

    return (
       <div className="flex flex-col items-start w-full justify-between h-full">
         <nav className="flex flex-col gap-4  w-full px-2">
            {routes.map((route) => {
                const url = `/atelier${!route.url ? "" : '/'}${route.url}`
                const isActive = pathname === url;
                return (
                    <Link
                        key={route.url}
                        href={url}
                        className={`flex items-center gap-3 px-3 py-1 rounded-md transition-colors
                            ${isActive
                                ? 'bg-accent text-primary-foreground'
                                : 'hover:bg-fg-2'
                            }
                            ${shrinked ? 'justify-center' : ''}
                        `}
                    >
                        {route.icon}
                        {!shrinked && <span>{route.name}</span>}
                    </Link>
                );
            })}

        
        </nav>
        <div className="border-t w-full flex items-center justify-center ">  <Logout/></div>
       </div>
    );
}