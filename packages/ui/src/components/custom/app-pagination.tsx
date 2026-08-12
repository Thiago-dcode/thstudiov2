import type { Pagination as PaginationType } from "@repo/common-lib/types/response"
import {
 Pagination,
 PaginationContent,
 PaginationEllipsis,
 PaginationItem,
 PaginationLink,
 PaginationNext,
 PaginationPrevious,
} from "../shadcn/pagination"
import { cn } from "../../lib/utils"

/**
 * Localized pagination chrome. Defaults are English so existing call sites keep working, but the
 * public directory pages pass translated strings — pagination is the only crawlable path to
 * everything past page 1, so its anchor text should be in the page's language.
 */
export type PaginationLabels = {
 previous: string
 next: string
 previousAria: string
 nextAria: string
}

type AppPaginationProps = {
 pagination: PaginationType
 buildHref: (page: number) => string
 className?: string
 labels?: Partial<PaginationLabels>
}

const SIBLINGS = 1

function getVisiblePages(current: number, last: number): (number | "ellipsis")[] {
 if (last <= 1) return []
 if (last <= 5) return Array.from({ length: last }, (_, i) => i + 1)

 const pages: (number | "ellipsis")[] = []
 const rangeStart = Math.max(2, current - SIBLINGS)
 const rangeEnd = Math.min(last - 1, current + SIBLINGS)

 pages.push(1)
 if (rangeStart > 2) pages.push("ellipsis")
 for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
 if (rangeEnd < last - 1) pages.push("ellipsis")
 pages.push(last)

 return pages
}

export function AppPagination({ pagination, buildHref, className, labels }: AppPaginationProps) {
 const { current_page, last_page, prev_page, next_page } = pagination
 if (last_page <= 1) return null

 const pages = getVisiblePages(current_page, last_page)

 return (
 <Pagination className={cn("py-6", className)}>
 <PaginationContent>
 <PaginationItem>
 <PaginationPrevious
 label={labels?.previous}
 ariaLabel={labels?.previousAria}
 href={prev_page ? buildHref(prev_page) : undefined}
 aria-disabled={!prev_page}
 tabIndex={prev_page ? undefined : -1}
 className={cn(!prev_page && "pointer-events-none opacity-50")}
 />
 </PaginationItem>

 {pages.map((page, i) =>
 page === "ellipsis" ? (
 <PaginationItem key={`ellipsis-${i}`}>
 <PaginationEllipsis />
 </PaginationItem>
 ) : (
 <PaginationItem key={page}>
 <PaginationLink
 href={buildHref(page)}
 isActive={page === current_page}
 >
 {page}
 </PaginationLink>
 </PaginationItem>
 ),
 )}

 <PaginationItem>
 <PaginationNext
 label={labels?.next}
 ariaLabel={labels?.nextAria}
 href={next_page ? buildHref(next_page) : undefined}
 aria-disabled={!next_page}
 tabIndex={next_page ? undefined : -1}
 className={cn(!next_page && "pointer-events-none opacity-50")}
 />
 </PaginationItem>
 </PaginationContent>
 </Pagination>
 )
}
