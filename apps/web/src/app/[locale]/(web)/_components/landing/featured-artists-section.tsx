import { getTranslations } from "next-intl/server";
import { landingCache } from "@/lib/config";
import { isDirectoryOpen } from "@/lib/directory-visibility";
import usersService from "@/modules/users/users.service";
import { ArtistProfileCard } from "../directory/artist-profile-card";
import { NextSectionArrow } from "./next-section-arrow";
import { reportSectionError } from "./section-error";
import {
  EDITORIAL_LINK_CLASS,
  editorialNumber,
  FULL_SCREEN_MIN_H,
  type LandingSectionProps,
  WebSection,
} from "./web-section";

export async function FeaturedArtistsSection({
  id,
  nextSectionId,
  index,
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
      <WebSection.Container className="max-w-6xl px-5 py-24 tablet:px-10">
        <WebSection.EditorialHeader
          className="mb-16 laptop:mb-20"
          label={t("header.badge")}
          qualifier={index ? editorialNumber(index) : undefined}
          title={t("header.title")}
          standfirst={t("header.description")}
        />

        <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-x-8 gap-y-12">
          {artists.map((artist) => (
            <ArtistProfileCard
              key={artist.id}
              artist={artist}
              className="w-full"
            />
          ))}
        </div>

        {directoryOpen && (
          <div className="mt-16 flex">
            <WebSection.ActionLink
              href="/artists"
              className={EDITORIAL_LINK_CLASS}
            >
              {t("browseAll")}
            </WebSection.ActionLink>
          </div>
        )}
      </WebSection.Container>
      <NextSectionArrow nextSectionId={nextSectionId} />
    </WebSection>
  );
}
