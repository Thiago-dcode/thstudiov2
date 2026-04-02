import { ArtistProfileCard } from "../../artists/_components/artist-profile-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import usersService from "@/modules/users/users.service";


export async function FeaturedArtistsSection() {
  //TODO fetch highlighted artists.

  const usersResponse = await usersService.findAll({
    is_featured: true
  });
  const artists = usersResponse.data || [];

  if (!artists.length) return null;
  console.log(artists)
  return (
    <section className="mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28">
      <header className="mb-12 flex flex-col items-center gap-3 text-center">
        <h2 className="font-serif text-3xl font-medium italic tracking-tight tablet:text-4xl">
          Featured Artists
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-text-muted tablet:text-base">
          A glimpse into the community shaping the platform.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 tablet:grid-cols-4">
        {artists.map((artist) => (
          <ArtistProfileCard key={artist.id} artist={artist} />
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
    </section>
  );
}
