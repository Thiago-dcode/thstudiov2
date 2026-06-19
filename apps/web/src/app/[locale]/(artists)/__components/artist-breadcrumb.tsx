import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "@repo/ui/components/shadcn/breadcrumb";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export type BreadcrumbEntry = {
 url: string;
 title: string;
 isActive: boolean;
};

type ArtistBreadcrumbProps = {
 username: string;
 items?: BreadcrumbEntry[];
 backUrl?: string;
 className?: string;
};

export const ArtistBreadcrumb = ({
 username,
 items = [],
 backUrl,
 className,
}: ArtistBreadcrumbProps) => {
 const allItems: BreadcrumbEntry[] = [
 {
 url: `/artists/${username}`,
 title: `@${username}`,
 isActive: items.length === 0,
 },
 ...items,
 ];

 return (
 <Breadcrumb className={cn("mb-8 md:mb-12", className)}>
 <BreadcrumbList className="flex-nowrap gap-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">
 {backUrl && (
 <BreadcrumbItem>
 <BreadcrumbLink asChild>
 <Link
 href={backUrl}
 aria-label="Go back"
 className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-text-muted/70 transition-colors hover:text-text"
 >
 <ArrowLeft className="size-3.5" />
 <span>Go back</span>
 </Link>
 </BreadcrumbLink>
 </BreadcrumbItem>
 )}
 {allItems.map((item, index) => (
 <React.Fragment key={item.url}>
 <BreadcrumbItem className="gap-2 line-clamp-1">
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
 );
};
