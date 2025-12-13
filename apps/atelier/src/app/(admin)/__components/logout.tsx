'use client'
import { useSession } from "@/modules/auth/contexts/session.provider"
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action"
import { Button } from "@repo/ui/components/shadcn/button"
import { FormEvent, useState } from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@repo/ui/components/shadcn/popover"
import { useRouter } from "next/navigation"
export const Logout = () => {
    const router = useRouter()
    const { setSession } = useSession();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false)
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        if (loading) return;
        setLoading(true);
        e.preventDefault();
        const result = await logoutServerAction();

        if (!result) {
            setLoading(false)
            return;
        }
        setSession(undefined);
        router.push('/auth/login');



    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Logout
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 flex flex-col items-center justify-between gap-8">

                {!loading ? <>
                    <h3 className="text-lg">Are you sure you want to logout?</h3>
                    <div className="flex items-center justify-between gap-8">
                        <Button onClick={() => {
                            setOpen(false)
                        }} variant={'destructive'}>Cancel</Button>
                        <form onSubmit={handleSubmit}>
                            <Button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Yes, im sure
                            </Button>
                        </form>
                    </div>
                </> : <div>Logging out...</div>}
            </PopoverContent>
        </Popover>

    )
}