import { userSession } from "@/modules/auth/server-actions/user-session.action";
import { redirect } from "next/navigation";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    return (
        <div className="size-full flex items-center justify-center">
            WELCOME TO MEDIA PAGE
        </div>
    )
}