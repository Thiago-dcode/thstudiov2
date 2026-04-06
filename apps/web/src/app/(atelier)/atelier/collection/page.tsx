import { userSession } from "@/modules/auth/server-actions/user-session.action";
import collectionService from "@/modules/collections/collection.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";
import { Button } from "@repo/ui/components/shadcn/button";
import { Plus } from "lucide-react";
import { CollectionCard } from "@/modules/collections/components/collection-card";

export default async function CollectionListPage() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const collectionsResponse = await collectionService.findAll({
        user_id: userAuth.id
    });

    if (collectionsResponse.error) {
        return <div>{collectionsResponse?.error?.message || 'Something went wrong'}</div>;
    }


    return (
        <AdminPageContainer>
            <AdminPageTitle
                title="Collections"
                info="Collections are simple sets of related media grouped by a specific event or theme, like 'The Wedding of John' or 'Morocco 2026'."
            >
                <Button asChild variant="primary" size="sm">
                    <Link href={'collection/create'}>
                        <Plus className="size-4" />
                        Create Collection
                    </Link>
                </Button>
            </AdminPageTitle>
            {collectionsResponse.data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {collectionsResponse.data.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            username={userAuth.username}
                            isAtelier
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No collections found
                </div>
            )}
        </AdminPageContainer>
    );
}
