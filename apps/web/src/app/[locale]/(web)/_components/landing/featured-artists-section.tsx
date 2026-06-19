import { getTranslations } from "next-intl/server";
import usersService from "@/modules/users/users.service";
import { ArtistProfileCard } from "../../[search]/_components/artist-profile-card";
import { WebSection } from "./web-section";

export async function FeaturedArtistsSection() {
 const t = await getTranslations("landing.featuredArtists");
 const usersResponse = await usersService.findAll({
 is_featured: true,
 });
 const artists = usersResponse.data || [];

 if (!artists.length) return null;

 return (
 <WebSection>
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
