import userCollectionService from "@/modules/user-collections/user-collection.service";
import usersService from "@/modules/users/users.service";
import { notFound } from "next/navigation";
import Web from "@/lib/components/web-page.component";
import { ArtistBreadcrumb } from "@/app/(artists)/__components/artist-breadcrumb";
import { CollectionCard } from "@/modules/collections/components/collection-card";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function Page({ params }: Props) {
  const { username } = await params;

  const [userExist, response] = await Promise.all([
    usersService.usernameExists(username),
    userCollectionService.getAllByUsername(username, { blocked: false }),
  ]);

  if (!userExist.data) {
    notFound();
  }

  const collections = response.data || [];

  return (
    <Web.Container>
      <ArtistBreadcrumb
        username={username}
        items={[
          { url: `/artists/${username}/collections`, title: "Collections", isActive: true },
        ]}
      />

      <Web.Header title="Collections" />

      {collections.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              username={username}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center border border-dashed border-border/60 text-sm italic text-text-muted">
          No collections yet.
        </div>
      )}
    </Web.Container>
  );
}
