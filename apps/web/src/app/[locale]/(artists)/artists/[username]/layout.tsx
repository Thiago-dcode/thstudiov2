import { normalizeUsername } from "@repo/common-lib/utils/username";
import { type ReactNode, Suspense } from "react";
import { WebFooter } from "@/lib/components/web-footer";
import { ArtistProvider } from "@/modules/users/providers/artist.provider";
import { ArtistBrandMark } from "../../__components/artist-brand-mark";
import { ArtistsHeader } from "../../__components/artists-header";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string; username: string }>;
};

export default async function Layout({ children, params }: Props) {
  const { username } = await params;

  return (
    <ArtistProvider>
      <div className="flex min-h-screen flex-col w-full">
        <ArtistsHeader />
        <main className="flex-1 w-full pt-20">{children}</main>
        {/* Streamed on its own: the plan lookup must never hold up the artist's content. */}
        <Suspense fallback={null}>
          <ArtistBrandMark username={normalizeUsername(username)} />
        </Suspense>
        <WebFooter />
      </div>
    </ArtistProvider>
  );
}
