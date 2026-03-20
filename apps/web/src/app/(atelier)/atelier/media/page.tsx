import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";
import { MediaGridClient } from "./_components/media-grid-client";
import SelectMediaProvider from "@/modules/media/providers/select-media.provider";
import { AdminPageContainer, AdminPageTitle } from "../../__components/admin-page.component";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const mediaResponse = await usersService.getAllMedia(userAuth.id);

    return (
        <AdminPageContainer>
            <AdminPageTitle title="Media">
              
            </AdminPageTitle>
             
                <SelectMediaProvider>
                    <MediaGridClient media={mediaResponse.data || []} username={userAuth.username} />
                </SelectMediaProvider>
            
        </AdminPageContainer>
    )
}