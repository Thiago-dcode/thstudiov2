import type { ArtistCard } from "@repo/common-lib/types/user";
import { ArtistProfileCard } from "../../artists/_components/artist-profile-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import usersService from "@/modules/users/users.service";

const MOCK_ARTISTS: ArtistCard[] = [
  {
    id: 1,
    username: "elena.voss",
    name: "Elena",
    surname: "Voss",
    profession: "Oil Painter",
    short_biography: "Exploring light and texture through contemporary realism",
    address: { city: "Berlin", state: null, country: "Germany" },
    categories: [{ id: 1, name: "Painting" }, { id: 2, name: "Fine Art" }],
  },
  {
    id: 2,
    username: "kai.tanaka",
    name: "Kai",
    surname: "Tanaka",
    profession: "Ceramic Artist",
    short_biography: "Handcrafted vessels inspired by wabi-sabi philosophy",
    address: { city: "Kyoto", state: null, country: "Japan" },
    categories: [{ id: 3, name: "Ceramics" }],
  },
  {
    id: 3,
    username: "sofia.duarte",
    name: "Sofía",
    surname: "Duarte",
    profession: "Photographer",
    short_biography: "Documentary portraits of urban life",
    address: { city: "Mexico City", state: null, country: "Mexico" },
    categories: [{ id: 4, name: "Photography" }, { id: 5, name: "Documentary" }],
  },
  {
    id: 4,
    username: "marcus.rowe",
    name: "Marcus",
    surname: "Rowe",
    profession: "Sculptor",
    short_biography: "Large-scale metal and stone installations",
    address: { city: "London", state: null, country: "UK" },
    categories: [{ id: 6, name: "Sculpture" }, { id: 7, name: "Installation" }],
  },
  {
    id: 5,
    username: "ines.lamar",
    name: "Inès",
    surname: "Lamar",
    profession: "Illustrator",
    short_biography: "Editorial illustration with a surrealist edge",
    address: { city: "Paris", state: null, country: "France" },
    categories: [{ id: 8, name: "Illustration" }],
  },
  {
    id: 6,
    username: "adrien.kofi",
    name: "Adrien",
    surname: "Kofi",
    profession: "Mixed Media Artist",
    short_biography: "Collage and assemblage rooted in identity and memory",
    address: { city: "Accra", state: null, country: "Ghana" },
    categories: [{ id: 9, name: "Mixed Media" }, { id: 10, name: "Collage" }],
  },
];

export async function FeaturedArtistsSection() {
  //TODO fetch highlighted artists.

  const usersResponse = await usersService.findAll({
    highlight: true
  });
  console.log(usersResponse)
  const artists = usersResponse.data || [];
  if (!artists.length) return null;
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
