import { cn } from "../../lib/utils"

interface BrandLogoProps {
    collapsed?: boolean
    className?: string
}

export const BrandLogo = ({ collapsed = false, className }: BrandLogoProps) => (
    <span
        className={cn(
            "text-xl font-medium tracking-tight select-none",
            className
        )}
    >
        A<span className="text-accent">11</span>{!collapsed && "STUDIO"}
    </span>
)
