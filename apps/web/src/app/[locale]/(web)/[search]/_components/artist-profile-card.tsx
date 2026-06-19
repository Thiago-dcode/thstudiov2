import type { ArtistCard } from "@repo/common-lib/types/user";
import { cn } from "@repo/ui/lib/utils";
import { MapPin, Tags } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function artistDisplayName(a: ArtistCard): string {
 const full = [a.name, a.surname].filter(Boolean).join(" ").trim();
 return full || a.username;
}

function artistLocation(a: ArtistCard): string | null {
 const addr = a.address;
 if (!addr) return null;
 const parts = [addr.city, addr.state, addr.country].filter((x): x is string =>
 Boolean(x?.trim()),
 );
 return parts.length ? parts.join(", ") : null;
}

function initials(a: ArtistCard): string {
 const n = artistDisplayName(a).trim();
 if (!n) return "?";
 const parts = n.split(/\s+/).filter(Boolean);
 if (parts.length >= 2) {
 const first = parts[0]?.[0];
 const second = parts[1]?.[0];
 if (first && second) {
 return (first + second).toUpperCase();
 }
 }
 return n.slice(0, 2).toUpperCase();
}

function addressFieldCount(address: ArtistCard["address"]): number {
 if (!address) return 0;
 return [address.city, address.state, address.country].filter((x) =>
 Boolean(x?.trim()),
 ).length;
}

function artistBioLine(a: ArtistCard): string {
 const bio = a.short_biography?.trim();
 if (bio) return bio;
 const prof = a.profession?.trim();
 if (prof) return prof;
 return `@${a.username}`;
}

export type ArtistProfileCardProps = {
 artist: ArtistCard;
 className?: string;
 compact?: boolean;
};

export function ArtistProfileCard({
 artist,
 className,
 compact,
}: ArtistProfileCardProps) {
 const name = artistDisplayName(artist);
 const href = `/artists/${encodeURIComponent(artist.username)}`;
 const loc = artistLocation(artist);
 const categoryCount = artist.categories?.length ?? 0;
 const locationFields = addressFieldCount(artist.address);

 return (
 <Link
 href={href}
 aria-label={`Open profile: ${name}, @${artist.username}`}
 className={cn(
 "max-w-72 group flex h-full min-h-0 flex-col overflow-hidden bg-fg p-2 shadow-md ring-1 ring-border/40 transition-all duration-300",
 "hover:-translate-y-0.5 hover:shadow-lg hover:ring-border/60",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
 className,
 )}
 >
 <div
 className={cn(
 "relative w-full shrink-0 overflow-hidden bg-fg-1/60",
 compact ? "aspect-square" : "aspect-4/5",
 )}
 >
 {artist.avatar ? (
 <Image
 src={artist.avatar}
 alt=""
 fill
 className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
 />
 ) : (
 <span
 className="flex size-full items-center justify-center font-serif text-3xl italic tracking-tight text-text-muted/50 tablet:text-4xl"
 aria-hidden
 >
 {initials(artist)}
 </span>
 )}
 </div>

 <div className="flex min-h-0 flex-1 flex-col gap-2 px-1.5 pb-1 pt-3">
 <div className="min-w-0 space-y-1">
 <h4 className="truncate font-sans text-base font-medium leading-snug text-text tablet:text-lg">
 {name}
 </h4>
 <p className="line-clamp-2 text-sm leading-relaxed text-text-muted tablet:text-base">
 {artistBioLine(artist)}
 </p>
 </div>

 {loc ? (
 <p className="line-clamp-1 text-xs text-text-muted/85 tablet:text-sm">
 {loc}
 </p>
 ) : null}

 <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
 <div className="flex min-w-0 items-center gap-3 text-text-muted">
 <span
 className="inline-flex items-center gap-1 text-xs font-medium tablet:text-sm"
 title="Specialties"
 >
 <Tags className="size-3.5 shrink-0 opacity-70" aria-hidden />
 {categoryCount}
 </span>
 <span
 className="inline-flex items-center gap-1 text-xs font-medium tablet:text-sm"
 title={
 locationFields
 ? "Location details on profile"
 : "No location listed"
 }
 >
 <MapPin className="size-3.5 shrink-0 opacity-70" aria-hidden />
 {locationFields}
 </span>
 </div>
 <span className="shrink-0 bg-fg-2 px-3 py-1.5 text-center text-xs font-semibold text-text transition-colors group-hover:bg-fg-1 tablet:px-3.5 tablet:text-sm">
 View
 </span>
 </div>
 </div>
 </Link>
 );
}
