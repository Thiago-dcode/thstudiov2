import { getTranslations } from "next-intl/server";
import { landingCache } from "@/lib/config";
import usersService from "@/modules/users/users.service";
import { ArtistProfileCard } from "../../[search]/_components/artist-profile-card";
import { reportSectionError } from "./section-error";
import { WebSection } from "./web-section";

export async function FeaturedArtistsSection() {
  const t = await getTranslations("landing.featuredArtists");
  const usersResponse = await usersService.findAll(
    { is_featured: true },
    landingCache("users-featured"),
  );
  reportSectionError("featured-artists", usersResponse);
  const artists = usersResponse.data || [];

  if (!artists.length) return null;

  return (
    <WebSection id="featured-artists">
      <WebSection.Container>
        <WebSection.Header
          badge={t("header.badge")}
          title={t("header.title")}
          description={t("header.description")}
        />

        <div className="mx-auto grid w-full max-w-(--screen-laptop) grid-cols-[repeat(auto-fit,min(100%,18rem))] justify-center justify-items-center gap-4">
          {artists.map((artist) => (
            <ArtistProfileCard
              key={artist.id}
              artist={artist}
              className="w-full"
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <WebSection.ActionLink href="/artists">
            {t("browseAll")}
          </WebSection.ActionLink>
        </div>
      </WebSection.Container>
    </WebSection>
  );
}
