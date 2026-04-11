'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) return <div className="size-8" />

    const isDark = resolvedTheme === 'dark'

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'relative size-8 flex items-center justify-center rounded-full',
                'text-text-muted hover:text-text transition-colors cursor-pointer',
                className,
            )}
        >
            <Sun
                className={cn(
                    'size-3.5 absolute transition-all duration-300',
                    isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100',
                )}
            />
            <Moon
                className={cn(
                    'size-3.5 absolute transition-all duration-300',
                    isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0',
                )}
            />
        </button>
    )
}
