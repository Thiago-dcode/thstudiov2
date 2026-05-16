import { userSession } from "@/modules/auth/server-actions/user-session.action";
import collectionService from "@/modules/collections/collection.service";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle, AdminPageEmptyState } from "../../__components/admin-page.component";
import { Library } from "lucide-react";
import { CollectionCard } from "@/modules/collections/components/collection-card";
import { CreateResourceButton } from "../../__components/create-resource-button";
import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import Link from "next/link";

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
                <CreateResourceButton resource={TABLES_ENUM.COLLECTIONS} href="collection/create" label="Create Collection" />
            </AdminPageTitle>
            {collectionsResponse.data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {collectionsResponse.data.map((collection) => (
                        <Link key={collection.id} href={`/atelier/collections/edit/${collection.slug}`}>
                            <CollectionCard
                                collection={collection}
                                isAtelier
                            /></Link>
                    ))}
                </div>
            ) : (
                <AdminPageEmptyState
                    icon={<Library />}
                    description="No collections created yet. Start by adding a set of related media."
                >
                    <CreateResourceButton resource={TABLES_ENUM.COLLECTIONS} href="collection/create" label="Create Collection" variant="outline" />
                </AdminPageEmptyState>
            )}
        </AdminPageContainer>
    );
}
