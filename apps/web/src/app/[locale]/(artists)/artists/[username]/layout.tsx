import type { ReactNode } from "react";
import { WebFooter } from "@/lib/components/web-footer";
import { ArtistProvider } from "@/modules/users/providers/artist.provider";
import { ArtistsHeader } from "../../__components/artists-header";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <ArtistProvider>
      <div className="flex min-h-screen flex-col w-full">
        <ArtistsHeader />
        <main className="flex-1 w-full pt-16">{children}</main>
        <WebFooter />
      </div>
    </ArtistProvider>
  );
}
