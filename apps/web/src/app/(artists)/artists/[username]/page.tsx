import Image from "next/image";
import Link from "next/link";
import UserService from "@/modules/users/users.service";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { MapPin, ArrowRight, Mail } from "lucide-react";
import { Suspense } from "react";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { notFound } from "next/navigation";
import { ArtistContactDialog } from "../../__components/artist-contact.dialog";
import { ArtistSections } from "../../__components/artist-sections";

const ArtistHomePage = async ({ params }: { params: Promise<{ username: string }> }) => {
    const { username } = await params;
    const { data: profile } = await UserService.getProfile(username);

    if (!profile) {
        notFound();
    }

    const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");

    return (
        <div className="min-h-screen w-full animate-in fade-in duration-1000">
            {/* Hero Banner — full-bleed up to desktop */}
            <section className="relative w-full">
                <div className="relative w-full h-[30vh] tablet:h-[38vh] laptop:h-[42vh] desktop:h-[46vh]">
                    <Image
                        alt={`${profile.username}'s banner`}
                        src={profile.banner || fallbackBanner}
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/20 to-transparent" />
                    <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-transparent" />
                </div>

                {/* Avatar — anchored at banner bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                    <div className="relative size-32 tablet:size-36 laptop:size-40 rounded-full ring-[5px] ring-bg bg-fg-1 overflow-hidden shadow-2xl">
                        {profile.avatar ? (
                            <Image
                                src={profile.avatar}
                                alt={profile.username}
                                fill
                                className="object-cover"
                                sizes="160px"
                            />
                        ) : (
                            <div className="size-full flex items-center justify-center">
                                <span className="text-5xl font-serif italic text-text-muted/50">
                                    {profile.username?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Profile Identity + CTAs */}
            <section className="w-full max-w-2xl mx-auto px-6 pt-24 tablet:pt-28 pb-12 flex flex-col items-center text-center gap-6">
                <div className="space-y-3">
                    {fullName && (
                        <h1 className="text-3xl tablet:text-4xl laptop:text-5xl font-serif italic tracking-tight leading-tight">
                            {fullName}
                        </h1>
                    )}
                    {profile.profession && (
                        <p className="text-sm tablet:text-base tracking-wide text-text-muted">
                            {profile.profession}
                        </p>
                    )}
                    <p className="text-xs uppercase tracking-[0.25em] text-text-muted/70">
                        @{profile.username}
                    </p>
                </div>

                {profile.address?.formated_address && (
                    <div className="flex items-center gap-1.5 text-sm text-text-muted/80">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>{profile.address.formated_address}</span>
                    </div>
                )}

                {profile.categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {profile.categories.map((cat) => (
                            <Badge key={cat.id} variant="outline">
                                {cat.name}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* CTAs — directly under identity */}
                <div className="flex flex-col phone-lg:flex-row items-center justify-center gap-3 pt-4">
                    <ArtistContactDialog>
                        <button className="inline-flex items-center gap-2.5 px-7 py-3 text-xs tracking-[0.15em] uppercase bg-text text-bg rounded-sm hover:bg-text/90 transition-all duration-300 cursor-pointer group">
                            <Mail className="size-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
                            <span>Get in touch</span>
                        </button>
                    </ArtistContactDialog>

                    <Link
                        href={`/artists/${profile.username}/about`}
                        className="inline-flex items-center gap-2.5 px-7 py-3 text-xs tracking-[0.15em] uppercase text-text-muted border border-border/50 rounded-sm hover:text-text hover:border-text/30 transition-all duration-300 group"
                    >
                        <span>About</span>
                        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </section>

            {/* Short Biography — editorial pull-quote */}
            {profile.short_biography && (
                <section className="w-full mx-auto px-6  pb-20">
                    <div className="relative py-8">
                        <blockquote className=" w-full mx-auto text-center text-base tablet:text-lg leading-[1.9] text-text-muted font-serif italic">
                            &ldquo;{profile.short_biography}&rdquo;
                        </blockquote>
                       
                    </div>
                </section>
            )}
            {/* Highlighted Content Sections */}
            <div className="w-full pt-8 pb-24">
                <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
                    <ArtistSections
                        username={profile.username}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default ArtistHomePage;
