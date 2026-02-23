'use client'

import { useMainNav } from "../providers/main-nav.provider"
import { PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react"

export const TopNav = () => {
    const { shrinked, toggleShrinked, toggleMobile } = useMainNav();

    return (
        <nav className="border-b border-b-fg-2 w-full h-16 shrink-0 flex items-center px-4">
            <button
                onClick={toggleMobile}
                className="md:hidden p-1.5 rounded-md text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>
            <button
                onClick={toggleShrinked}
                className="hidden md:block p-1.5 rounded-md text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
                aria-label={shrinked ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {shrinked ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
        </nav>
    )
}