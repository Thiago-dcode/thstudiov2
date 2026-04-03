import { userSession } from "@/modules/auth/server-actions/user-session.action";
import userCollectionService from "@/modules/user-collections/user-collection.service";
import { redirect, notFound } from "next/navigation";
import { CreateOrUpdateCollection } from "../../_components/create-update-collection";
import { DeleteCollectionDialog } from "../../_components/delete-collection-dialog";
import { AdminPageContainer, AdminPageTitle } from "@/app/(atelier)/__components/admin-page.component";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function CollectionEdit({ params }: Props) {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const { slug } = await params;
    const collectionResponse = await userCollectionService.getByUsername(userAuth.username, slug);

    if (collectionResponse.error) {
        return <div>{collectionResponse?.error?.message || 'Something went wrong'}</div>;
    }

    if (!collectionResponse.data) {
        notFound();
    }

    const collection = collectionResponse.data;
    const publicHref = userAuth.username
        ? `/artists/${userAuth.username}/collections/${collection.slug}`
        : undefined;

    return (
        <AdminPageContainer>
            <AdminPageTitle title={"Edit: " + collection.title} publicHref={publicHref}>
                <DeleteCollectionDialog collectionId={collection.id} collectionTitle={collection.title} />
            </AdminPageTitle>
            <CreateOrUpdateCollection defaultCollection={collection} />
        </AdminPageContainer>
    );
}
