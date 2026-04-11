'use client'

import { FormEvent, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@repo/ui/components/shadcn/input'
import { cn } from '@repo/ui/lib/utils'

export function WebHeaderArtistSearch({ className }: { className?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const [query, setQuery] = useState('')

    useEffect(() => {
        setQuery('')
    }, [pathname])

    const submit = () => {
        const trimmed = query.trim()
        const href = trimmed
            ? `/artists?${new URLSearchParams({ search: trimmed }).toString()}`
            : '/artists'
        router.push(href)
        setQuery('')
    }

    if(pathname==='/artists') return null;
    return (
        <form
            role="search"
            aria-label="Search artists"
            className={cn('w-full min-w-0', className)}
            onSubmit={(e: FormEvent) => {
                e.preventDefault()
                submit()
            }}
        >
            <div className="relative">
                <Search
                    className="pointer-events-none absolute top-1/2 left-3 z-1 size-4 -translate-y-1/2 text-text-muted"
                    aria-hidden
                />
                <Input
                    type="search"
                    name="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search artists…"
                    autoComplete="off"
                    className={cn(
                        'h-9 w-full rounded-md border border-border bg-bg-2/40 py-2 pr-3 pl-9',
                        'text-sm placeholder:text-text-muted/70',
                        'focus-visible:border-text/40 focus-visible:ring-2 focus-visible:ring-text/15',
                    )}
                />
            </div>
        </form>
    )
}
