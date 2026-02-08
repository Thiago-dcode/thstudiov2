import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";
import { CreateMediaDialog } from "./_components/create-media-modal";
import { FileInputProvider } from "@repo/ui/contexts/file.provider";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
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
                <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                    <CreateMediaDialog />
                </FileInputProvider>
            </AdminPageTitle>
            {mediaResponse.data && mediaResponse.data.length > 0 ? (
                <SelectMediaProvider>
                    <MediaGridClient media={mediaResponse.data} username={userAuth.username} />
                </SelectMediaProvider>
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No media found
                </div>
            )}
        </AdminPageContainer>
    )
}