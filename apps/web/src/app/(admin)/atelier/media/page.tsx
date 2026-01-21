

import { userSession } from "@/modules/auth/server-actions/user-session.action";
import usersService from "@/modules/users/users.service";
import { Dialog, DialogContent, DialogTrigger } from "@repo/ui/components/shadcn/dialog";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }

    const mediaResponse = await usersService.getAllMedia(userAuth.id);

    return (
        <div className="size-full p-4 overflow-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {mediaResponse.data?.map((media) => (
                    <Dialog>
                        <DialogTrigger>
                        <article key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-fg-1 group">
                        {media.thumbnail ? (
                            <Image
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                alt={media.seo_alt || `${userAuth.username} media`}
                                src={media.thumbnail}
                            />
                        ) : (
                            <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
                                No preview
                            </div>
                        )}
                    </article>
                        </DialogTrigger>
                        <DialogContent>
                            <p>{media.title}</p>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </div>
    )
}