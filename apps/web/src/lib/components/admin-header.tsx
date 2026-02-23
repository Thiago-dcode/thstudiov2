'use client'

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { MainNav } from "./main-nav.component"
import { useMainNav } from "../providers/main-nav.provider"

export const AdminHeader = () => {
    const { shrinked, mobileOpen, setMobileOpen } = useMainNav();
    const pathname = usePathname();

    useEffect(() => { setMobileOpen(false) }, [pathname]);

    return (
        <>
            {/* Desktop sidebar */}
            <header className={`hidden md:flex h-full flex-col items-center justify-start gap-10 border-r border-r-fg-2 bg-fg shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${shrinked ? 'w-16' : 'w-56'}`}>
                <div className="border-b border-b-fg-2 w-full h-16 shrink-0 flex items-center justify-center px-2">
                    <p className="text-xl text-center whitespace-nowrap overflow-hidden">
                        {shrinked ? 'A11' : 'A11STUDIO'}
                    </p>
                </div>
                <MainNav />
            </header>

            {/* Mobile drawer overlay */}
            <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                <aside className={`absolute left-0 top-0 h-full w-64 bg-fg flex flex-col border-r border-r-fg-2 transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="border-b border-b-fg-2 w-full h-16 shrink-0 flex items-center justify-between px-4">
                        <p className="text-xl">A11STUDIO</p>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 pt-6 overflow-y-auto">
                        <MainNav forceExpanded />
                    </div>
                </aside>
            </div>
        </>
    )
}