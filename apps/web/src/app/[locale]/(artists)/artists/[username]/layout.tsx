import { normalizeUsername } from "@repo/common-lib/utils/username";
import { type ReactNode, Suspense } from "react";
import { WebFooter } from "@/lib/components/web-footer";
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

  return (
    <ArtistProvider>
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
