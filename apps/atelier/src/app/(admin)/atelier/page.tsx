import { userSession } from "@/modules/auth/server-actions/get-session.action";
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action";

export default async function Atelier() {
    const userAuth = await userSession();
    
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

                    <form action={logoutServerAction}>
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}