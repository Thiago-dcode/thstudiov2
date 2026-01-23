import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { redirect } from "next/navigation";
import { CreateMediaDialog } from "./_components/create-media-modal";
import { FileInputProvider } from "@repo/ui/contexts/file.provider";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import { MediaGrid } from "./_components/media-grid";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const mediaResponse = await usersService.getAllMedia(userAuth.id);

    return (
        <div className="size-full p-4 overflow-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Media</h1>
                <FileInputProvider allowedMimeTypes={ALLOWED_IMAGE_FILE_TYPES}>
                    <CreateMediaDialog />
                </FileInputProvider>
            </div>
            {mediaResponse.data && mediaResponse.data.length > 0 ? (
                <MediaGrid media={mediaResponse.data} username={userAuth.username} />
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No media found
                </div>
            )}
        </div>
    )
}