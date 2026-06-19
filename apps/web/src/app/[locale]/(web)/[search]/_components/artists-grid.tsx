import type { ArtistCard } from "@repo/common-lib/types/user";
import { ArtistProfileCard } from "./artist-profile-card";

type ArtistsGridProps = {
  artists: ArtistCard[];
};

export function ArtistsGrid({ artists }: ArtistsGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 phone:grid-cols-2 tablet:grid-cols-3 tablet:gap-4 tablet-lg:grid-cols-4 laptop:grid-cols-5 laptop:gap-5">
      {artists.map((artist) => (
        <li
          key={artist.id}
          className="mx-auto w-full max-w-72 min-w-0 phone:mx-0 phone:max-w-none"
        >
          <ArtistProfileCard artist={artist} className="h-full" />
        </li>
      ))}
    </ul>
  );
}
