'use client'

import { useMainNav } from "../providers/main-nav.provider"

export const TopNav = () => {
    const { setShrinked } = useMainNav();


    return <nav className="border-b border-b-fg-2 w-full h-16 shrink-0 flex items-center px-4">
        TOP NAV
    </nav>

}