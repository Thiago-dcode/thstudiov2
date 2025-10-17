import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "@/modules/media/media.service";
import { redirect } from "next/navigation";
import { Logout } from "../__components/logout";

export default async function Atelier() {
    const userAuth = await userSession();
    if (!userAuth) {
        redirect('/');
    }
    const media = await mediaService.findAll();
    console.log("media result", media);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Atelier Dashboard
                        </h1>
                        <p className="text-sm text-slate-600">
                            Welcome, {userAuth?.email || 'User'}
                        </p>
                    </div>
                    <Logout />
                </div>
            </div>
        </div>
    )
}