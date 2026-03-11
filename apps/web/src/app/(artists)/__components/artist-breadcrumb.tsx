import * as React from "react"
import Link from "next/link"
import { cn } from "@repo/ui/lib/utils"
import { ChevronRight } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@repo/ui/components/shadcn/breadcrumb"

export type BreadcrumbEntry = {
    url: string
    title: string
    isActive: boolean
}

type ArtistBreadcrumbProps = {
    username: string
    items?: BreadcrumbEntry[]
    className?: string
}

export const ArtistBreadcrumb = ({ username, items = [], className }: ArtistBreadcrumbProps) => {
    const allItems: BreadcrumbEntry[] = [
        { url: `/artists/${username}`, title: `@${username}`, isActive: items.length === 0 },
        ...items
    ]

    return (
        <Breadcrumb className={cn("mb-8 md:mb-12", className)}>
            <BreadcrumbList className="flex-nowrap gap-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {allItems.map((item, index) => (
                    <React.Fragment key={item.url}>
                        <BreadcrumbItem className="gap-2">
                            {item.isActive ? (
                                <BreadcrumbPage className="text-[10px] font-normal uppercase tracking-[0.2em] text-text-muted cursor-default">
                                    {item.title}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link
                                        href={item.url}
                                        className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-text"
                                    >
                                        {item.title}
                                    </Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {index < allItems.length - 1 && (
                            <BreadcrumbSeparator className="[&>svg]:size-3">
                                <ChevronRight className="size-3" />
                            </BreadcrumbSeparator>
                        )}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
