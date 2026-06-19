import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import userServiceService from "@/modules/user-services/user-service.service";

export const UserServicesSection = async ({
 username,
 displayName,
}: {
 username: string;
 displayName: string;
}) => {
 const response = await userServiceService.getAllByUsername(username);

 const services = (response.data ?? []).filter((s) => s.is_active);

 if (response.error || services.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <p className="text-sm tracking-wide text-text-muted/70">
 {displayName} has no services yet&hellip;
 </p>
 </div>
 );
 }

 return (
 <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 tablet:gap-6">
 {services.map((service) => (
 <Link
 key={service.id}
 href={`/artists/${username}/services/${service.slug}`}
 className="group flex flex-col overflow-hidden border border-border/40 transition-colors duration-300 hover:border-border"
 >
 <div className="relative aspect-3/2 w-full overflow-hidden bg-fg-1">
 {service.thumbnail ? (
 <Image
 src={service.thumbnail}
 alt={service.title}
 fill
 className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
 sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center bg-fg-1">
 <span className="font-serif text-4xl italic text-text-muted/20">
 {service.title.charAt(0)}
 </span>
 </div>
 )}
 </div>

 <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
 <div className="flex items-start justify-between gap-3">
 <h3 className="text-base font-medium tracking-tight md:text-lg">
 {service.title}
 </h3>
 <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
 </div>

 {service.description && (
 <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
 {service.description}
 </p>
 )}

 {service.show_price && service.price != null && (
 <span className="mt-auto pt-2 text-sm font-serif italic text-text-muted">
 ${service.price.toFixed(2)}
 </span>
 )}
 </div>
 </Link>
 ))}
 </div>
 );
};
