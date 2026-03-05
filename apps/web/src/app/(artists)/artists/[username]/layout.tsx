import { ReactNode } from "react";
import { ArtistsHeader } from "../../__components/artists-header";
import { ArtistProvider } from "@/modules/users/providers/artist.provider";

export default async function Layout({ children }: { children: ReactNode }) {
    return (
        <ArtistProvider>
            <div className="size-full">
                <ArtistsHeader />
                <main className="size-full pt-12">{children}</main>
            </div>
        </ArtistProvider>
    )
}
