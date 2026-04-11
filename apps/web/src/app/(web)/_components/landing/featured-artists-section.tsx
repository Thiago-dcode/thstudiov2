import { ArtistProfileCard } from "../../artists/_components/artist-profile-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import usersService from "@/modules/users/users.service";
import { WebSection } from "./web-section";

export async function FeaturedArtistsSection() {
  const usersResponse = await usersService.findAll({
    is_featured: true,
  });
  const artists = usersResponse.data || [];

  if (!artists.length) return null;

  return (
    <WebSection>
      <WebSection.Container>
        <WebSection.Header
          badge="Discover"
          title="Artists you can connect with today"
          description="Every portfolio is a direct line between artist and client. Browse, discover, and start a conversation."
        />

        <div className="mx-auto grid max-w-(--screen-laptop) grid-cols-1 gap-4 phone:grid-cols-2 tablet:grid-cols-4">
          {artists.map((artist) => (
            <ArtistProfileCard key={artist.id} artist={artist} compact />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/artists"
            className="group inline-flex items-center gap-2 text-sm font-medium tracking-wider text-text-muted transition-colors hover:text-text"
          >
            Browse All Artists
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </WebSection.Container>
    </WebSection>
  );
}
