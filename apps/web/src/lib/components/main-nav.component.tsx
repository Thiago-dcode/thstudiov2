'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMainNav } from "../providers/main-nav.provider"
import { ReactNode, useEffect, useState } from "react";
import { Box, Grid, Home, Info, LayoutDashboard, Settings } from "lucide-react";
import { LogoutDialog } from "@/app/(admin)/__components/logout-dialog";
import { Spinner } from "@repo/ui/components/shadcn/spinner";

const routes: {
    name: string,
    url: string,
    matches?:string[],
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
            name: 'About',
            url: 'about',
            icon: <Info size={20} />
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
    const [isClient, setIsClient] = useState(false)
    const pathname = usePathname();
    const { shrinked } = useMainNav();



    useEffect(()=>{setIsClient(true)},[])
if(!isClient) return <Spinner/>
    return (
       <div className="flex flex-col items-start w-full justify-between h-full">
         <nav className="flex flex-col gap-4  w-full px-4">
            {routes.map((route) => {
                const url = `/atelier${!route.url ? "" : '/'}${route.url}`
                const isActive = pathname === url || route.matches?.some(match=> pathname == `/atelier/${match}`);
                return (
                    <Link
                        key={route.url}
                        href={url}
                        className={`text-sm flex items-center gap-3 px-2 py-1 rounded-sm transition-colors
                            ${isActive
                                ? 'bg-accent/80 text-primary-foreground'
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
        <div className="border-t w-full flex items-center justify-center ">  <LogoutDialog/></div>
       </div>
    );
}