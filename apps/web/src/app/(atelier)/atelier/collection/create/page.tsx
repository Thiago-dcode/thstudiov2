import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";
import { AdminPageContainer, AdminPageTitle } from "@/app/(atelier)/__components/admin-page.component";
import { CreateOrUpdateCollection } from "../_components/create-update-collection";

export default async function CollectionCreate() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Create a collection" />
            <CreateOrUpdateCollection />
        </AdminPageContainer>
    );
}
