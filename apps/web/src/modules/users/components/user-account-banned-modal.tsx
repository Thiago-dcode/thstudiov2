"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@repo/ui/components/shadcn/dialog"
import { Button } from "@repo/ui/components/shadcn/button"
import { Spinner } from "@repo/ui/components/shadcn/spinner"
import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { logoutServerAction } from "@/modules/auth/server-actions/logout.action"
import { useUserMetrics } from "../providers/user-metrics.provider"

export const UserAccountBannedModal = () => {
    const { isUserAccountBanned, metrics } = useUserMetrics()
    const [loggingOut, setLoggingOut] = useState(false)
    const router = useRouter()

    if (!isUserAccountBanned) return null

    const handleLogout = async () => {
        if (loggingOut) return
        setLoggingOut(true)
        const result = await logoutServerAction()
        if (result) {
            router.push("/auth/login")
        }
        setLoggingOut(false)
    }

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-xs [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="items-center text-center">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                    <DialogTitle>Account Suspended</DialogTitle>
                    <DialogDescription className="text-xs">
                        Your account has been suspended due to policy violations.
                        {metrics?.extra_data?.ban_lift && (
                            <> Restrictions will be lifted on{" "}
                                <span className="font-medium text-foreground">
                                    {new Date(metrics.extra_data.ban_lift).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                </span>.
                            </>
                        )}
                        {" "}
                        <a href="mailto:support@thstudio.com" className="underline text-foreground">
                            Contact support if you think this is a mistake
                        </a>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex w-full justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className=" self-end text-muted-foreground border"
                        disabled={loggingOut}
                        onClick={handleLogout}
                    >
                        {loggingOut ? <Spinner className="size-4" /> : "Logout"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
