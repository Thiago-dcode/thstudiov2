import { ReactNode } from "react";
import { ArtistsHeader } from "../../__components/artists-header";

export default function Layout({ children }: { children: ReactNode }) {

    return <div className="size-full">
        <ArtistsHeader />

        <main className="size-full pt-12">{children}</main></div>
}