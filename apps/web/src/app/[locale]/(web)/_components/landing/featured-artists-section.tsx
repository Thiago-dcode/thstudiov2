import { getTranslations } from "next-intl/server";
import { landingCache } from "@/lib/config";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import usersService from "@/modules/users/users.service";
import { ArtistProfileCard } from "../../[search]/_components/artist-profile-card";
import { NextSectionArrow } from "./next-section-arrow";
import { reportSectionError } from "./section-error";
import {
  FULL_SCREEN_MIN_H,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

export async function FeaturedArtistsSection({
  id,
  nextSectionId,
}: LandingSectionProps) {
  const [t, usersResponse, directoryOpen] = await Promise.all([
    getTranslations("landing.featuredArtists"),
    usersService.findAll({ is_featured: true }, landingCache("users-featured")),
    isDirectoryOpen(),
  ]);
  reportSectionError("featured-artists", usersResponse);
  const artists = usersResponse.data || [];

  if (!artists.length) return null;

  return (
    <WebSection
      id={id}
      className={`flex ${FULL_SCREEN_MIN_H} flex-col justify-center`}
    >
      <WebSection.Container className="py-20">
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

        {directoryOpen && (
          <div className="mt-10 flex justify-center">
            <WebSection.ActionLink href="/artists">
              {t("browseAll")}
            </WebSection.ActionLink>
          </div>
        )}
      </WebSection.Container>
      <NextSectionArrow nextSectionId={nextSectionId} />
    </WebSection>
  );
}
