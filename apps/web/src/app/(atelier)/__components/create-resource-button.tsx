'use client'

import { useRef } from "react"
import { Button } from "@repo/ui/components/shadcn/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider"
import { toast } from "@repo/ui/sonner"
import type { TableName } from "@repo/common-lib/types/database"
import { getResourceLimitInfo } from "./resource-limits"

type CreateResourceButtonProps = {
    resource: TableName,
    href: string,
    label: string,
    variant?: 'primary' | 'outline',
}

const TOAST_COOLDOWN_MS = 5000

export const CreateResourceButton = ({ resource, href, label, variant = 'primary' }: CreateResourceButtonProps) => {
    const { metrics } = useUserMetrics()
    const lastToastRef = useRef(0)

    const limitInfo = getResourceLimitInfo(metrics, resource)

    if (limitInfo?.isAtLimit) {
        return (
            <Button
                variant="primary"
                size="sm"
                className="opacity-60"
                onClick={() => {
                    const now = Date.now()
                    if (now - lastToastRef.current < TOAST_COOLDOWN_MS) return
                    lastToastRef.current = now
                    toast.error(`You've reached your plan limit for ${limitInfo.label} (${limitInfo.count}/${limitInfo.limit}). Upgrade your plan to create more.`)
                }}
            >
                <Plus className="size-4" />
                {label}
            </Button>
        )
    }

    return (
        <Button asChild variant={variant} size="sm">
            <Link href={href}>
                <Plus className="size-4" />
                {label}
            </Link>
        </Button>
    )
}
