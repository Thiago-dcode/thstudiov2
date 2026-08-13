import type { ReactNode } from "react";
import { normalizeUsername } from "@repo/common-lib/utils/username";
import { WebFooter } from "@/lib/components/web-footer";
import { getArtistShareReady } from "@/modules/users/get-artist-share-ready";
import { ArtistProvider } from "@/modules/users/providers/artist.provider";
import { ArtistsHeader } from "../../__components/artists-header";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  const shareReady = await getArtistShareReady(username);

  return (
    <ArtistProvider>
      <div className="flex min-h-screen flex-col w-full">
        <ArtistsHeader shareReady={shareReady} />
        <main className="flex-1 w-full pt-20">{children}</main>
        <WebFooter />
      </div>
    </ArtistProvider>
  );
}
