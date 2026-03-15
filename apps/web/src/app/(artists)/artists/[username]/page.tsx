import Image from "next/image";
import Link from "next/link";
import UserService from "@/modules/users/users.service";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { MapPin, ArrowRight, Mail } from "lucide-react";
import { Suspense } from "react";
import { UserPortfoliosSection } from "@/modules/portfolios/components/user-portfolios-section";
import { UserServicesSection } from "@/modules/services/components/user-services-section";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { notFound } from "next/navigation";
import { ArtistContactDialog } from "../../__components/artist-contact.dialog";

const ArtistHomePage = async ({ params }: { params: Promise<{ username: string }> }) => {
    const { username } = await params;
    const { data: profile } = await UserService.getProfile(username);

    if (!profile) {
        notFound();
    }

    const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");

    return (
        <div className="min-h-screen w-full animate-in fade-in duration-1000">
            {/* Hero: Banner + Centered Avatar */}
            <section className="w-full max-w-5xl mx-auto">
                <div className="relative aspect-video w-full max-h-80">
                    <Image
                        alt={`${profile.username}'s banner`}
                        src={profile.banner || fallbackBanner}
                        fill
                        className="object-cover rounded-b-md"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent rounded-b-md" />
                </div>

                <div className="relative flex justify-center -mt-16">
                    <div className="relative size-28 tablet:size-32 rounded-full ring-4 ring-bg bg-fg-1 overflow-hidden">
                        {profile.avatar ? (
                            <Image
                                src={profile.avatar}
                                alt={profile.username}
                                fill
                                className="object-cover"
                                sizes="128px"
                            />
                        ) : (
                            <div className="size-full flex items-center justify-center">
                                <span className="text-4xl font-serif italic text-text-muted/60">
                                    {profile.username?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Profile Identity */}
            <section className="w-full max-w-2xl mx-auto px-6 pt-8 pb-6 flex flex-col items-center text-center gap-5">
                <div className="space-y-2">
                    {fullName && (
                        <h1 className="text-3xl md:text-4xl font-serif italic tracking-tight">
                            {fullName}
                        </h1>
                    )}
                    {profile.profession && (
                        <p className="text-sm tracking-wide text-text-muted">
                            {profile.profession}
                        </p>
                    )}
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                        @{profile.username}
                    </p>
                </div>

                {profile.address?.formated_address && (
                    <div className="flex items-center gap-1.5 text-sm text-text-muted">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>{profile.address.formated_address}</span>
                    </div>
                )}

                {profile.categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                        {profile.categories.map((cat) => (
                            <Badge key={cat.id}>{cat.translation?.name || cat.name}</Badge>
                        ))}
                    </div>
                )}
            </section>

            {/* Short Biography */}
            {profile.short_biography && (
                <section className="w-full max-w-3xl mx-auto px-6 pb-14">
                    <div className="border-t border-border/40 pt-10">
                        <p className="max-w-xl mx-auto text-center text-base leading-[1.8] text-text-muted font-serif italic">
                            {profile.short_biography}
                        </p>
                    </div>
                </section>
            )}

            {/* CTAs */}
            <section className="w-full max-w-5xl mx-auto px-6 md:px-12 pb-14">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <ArtistContactDialog>
                        <button className="inline-flex items-center gap-2.5 px-6 py-3 text-sm tracking-wider uppercase bg-text text-bg rounded-sm hover:bg-text/90 transition-colors duration-300 cursor-pointer group">
                            <Mail className="size-4 transition-transform duration-300 group-hover:-translate-y-px" />
                            <span>Get in touch</span>
                        </button>
                    </ArtistContactDialog>

                    <Link
                        href={`/artists/${profile.username}/about`}
                        className="inline-flex items-center gap-2.5 px-6 py-3 text-sm tracking-wider uppercase text-text-muted border border-border/60 rounded-sm hover:text-text hover:border-border transition-colors duration-300 group"
                    >
                        <span>About {profile.name || profile.username}</span>
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </section>

            {/* Content Sections */}
            <div className="w-full flex flex-col gap-20 pb-20">
                <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
                    <UserPortfoliosSection username={profile.username} userId={profile.id} />
                </Suspense>
                <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
                    <UserServicesSection username={profile.username} />
                </Suspense>
            </div>
        </div>
    );
};

export default ArtistHomePage;
