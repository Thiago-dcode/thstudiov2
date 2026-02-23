import Link from "next/link";
import Image from "next/image";
import UserService from "@/modules/users/users.service";
import fallbackBanner from "@/assets/images/fallback-banner.jpg";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { MapPin } from "lucide-react";

const ArtistHomePage = async ({ params }: { params: Promise<{ artist: string }> }) => {
    const { artist } = await params;
    const { data: profile } = await UserService.getProfile(artist);

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 min-h-screen px-4 text-center">
                <h1 className="text-2xl font-semibold">Artist not found</h1>
                <p className="text-text-muted">
                    There is no artist with the name <span className="font-medium text-text">{artist}</span>.
                </p>
                <Link
                    href="/"
                    className="mt-2 px-4 py-2 rounded-md bg-accent text-white text-sm transition-colors hover:bg-accent/80"
                >
                    Go home
                </Link>
            </div>
        );
    }

    const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");

    return (
        <div className="min-h-screen w-full">
            <section className="w-full max-w-4xl mx-auto pb-8">
                {/* Banner */}
                <div className="relative max-h-74 aspect-video w-full">
                    <Image
                        alt={`${profile.username}'s banner`}
                        src={profile.banner || fallbackBanner}
                        fill
                        className="object-cover rounded-b-md"
                        priority
                    />
                    {/* Avatar */}
                    <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-fg bg-fg-1">
                        {profile.avatar ? (
                            <img
                                src={profile.avatar}
                                alt={profile.username}
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-text-muted rounded-full">
                                {profile.username?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile info */}
                <div className="pt-20 px-6 space-y-4">
                    <div>
                        {fullName && <h1 className="text-xl font-bold">{fullName}</h1>}
                        <p className="text-text-muted">@{profile.username}</p>
                    </div>

                    {profile.short_biography && (
                        <p className="text-sm">{profile.short_biography}</p>
                    )}

                    {profile.biography && (
                        <p className="text-sm text-text-muted whitespace-pre-line">{profile.biography}</p>
                    )}

                    {profile.address?.formated_address && (
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                            <MapPin size={14} className="shrink-0" />
                            <span>{profile.address.formated_address}</span>
                        </div>
                    )}

                    {profile.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {profile.categories.map((cat) => (
                                <Badge key={cat.id}>{cat.translation?.name || cat.name}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ArtistHomePage;