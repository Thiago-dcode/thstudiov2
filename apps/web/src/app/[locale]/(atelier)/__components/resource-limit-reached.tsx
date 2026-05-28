import Link from "next/link"
import { Button } from "@repo/ui/components/shadcn/button"
import { ArrowLeft, ShieldAlert } from "lucide-react"

type ResourceLimitReachedProps = {
    label: string,
    backHref: string,
    count: number,
    limit: number,
}

export const ResourceLimitReached = ({ label, backHref, count, limit }: ResourceLimitReachedProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-4 max-w-md mx-auto text-center">
            <div className="rounded-full bg-error/10 p-4">
                <ShieldAlert className="size-8 text-error" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-text">Plan limit reached</h2>
            <p className="text-sm">
                You&apos;ve used <strong className="text-text">{count}</strong> of <strong className="text-text">{limit}</strong> {label} allowed on your current plan.
                Upgrade your plan to create more, or manage your existing {label}.
            </p>
            <div className="flex gap-3 mt-2">
                <Button asChild variant="outline" size="sm">
                    <Link href={backHref}>
                        <ArrowLeft className="size-4" />
                        Go Back
                    </Link>
                </Button>
                <Button asChild variant="primary" size="sm">
                    <Link href="/atelier/settings/subscription">
                        Upgrade Plan
                    </Link>
                </Button>
            </div>
        </div>
    )
}
