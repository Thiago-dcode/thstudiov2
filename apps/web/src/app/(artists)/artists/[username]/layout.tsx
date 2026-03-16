import { ReactNode } from "react";
import { ArtistsHeader } from "../../__components/artists-header";
import { ArtistProvider } from "@/modules/users/providers/artist.provider";
import { WebFooter } from "@/lib/components/web-footer";

export default async function Layout({ children }: { children: ReactNode }) {
    return (
        <ArtistProvider>
            <div className="flex min-h-screen flex-col w-full">
                <ArtistsHeader />
                <main className="flex-1 w-full pt-16">{children}</main>
                <WebFooter />
            </div>
        </ArtistProvider>
    )
}
