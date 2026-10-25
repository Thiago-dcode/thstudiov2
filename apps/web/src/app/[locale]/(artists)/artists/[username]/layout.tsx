import { normalizeUsername } from "@repo/common-lib/utils/username";
import { type ReactNode, Suspense } from "react";
import { WebFooter } from "@/lib/components/web-footer";
import { getArtistProfile } from "@/modules/users/get-artist-share-ready";
import { ArtistProvider } from "@/modules/users/providers/artist.provider";
import { ArtistInvite } from "../../__components/artist-invite";
import { ArtistsHeader } from "../../__components/artists-header";
import { HiddenProfileNotice } from "../../__components/hidden-profile-notice";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string; username: string }>;
};

export default async function Layout({ children, params }: Props) {
  const { username } = await params;
  // The same `cache()`d lookup `generateMetadata` and the pages make, so no extra request. Never
  // `notFound()` here: the pages own that, and a renamed username must still reach their redirect.
  const profile = await getArtistProfile(normalizeUsername(username));
  // Only the compact fields cross into the client provider, never the full profile.
  const artist = profile
    ? {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        surname: profile.surname,
      }
    : null;

  return (
    <ArtistProvider artist={artist}>
      <div className="flex min-h-screen flex-col w-full">
        <ArtistsHeader />
        <main className="flex-1 w-full pt-20">
          {/* Streamed on its own like the brand mark: never holds up the artist's content. */}
          <Suspense fallback={null}>
            <HiddenProfileNotice username={normalizeUsername(username)} />
          </Suspense>
          {children}
        </main>
        <ArtistInvite placement="end_of_content" />
        <WebFooter artistPage />
      </div>
    </ArtistProvider>
  );
}
