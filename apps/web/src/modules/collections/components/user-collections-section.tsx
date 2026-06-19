import userCollectionService from "@/modules/user-collections/user-collection.service";
import { CollectionCard } from "./collection-card";

export const UserCollectionsSection = async ({
 username,
 displayName,
 isHighlight,
}: {
 username: string;
 displayName: string;
 isHighlight?: boolean;
}) => {
 const response = await userCollectionService.getAllByUsername(
 username,
 isHighlight !== undefined ? { is_highlight: isHighlight } : undefined,
 );

 if (response.error || !response.data?.length) {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <p className="text-sm tracking-wide text-text-muted/70">
 {displayName} has no collections yet&hellip;
 </p>
 </div>
 );
 }

 return (
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 tablet:grid-cols-4 tablet:gap-5">
 {response.data.map((collection) => (
 <CollectionCard key={collection.id} collection={collection} />
 ))}
 </div>
 );
};
