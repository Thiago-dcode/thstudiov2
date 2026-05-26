import { ReactNode } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../shadcn/hover-card"
import { Info } from "lucide-react"
import { cn } from "../../lib/utils"

type InfoTooltipProps = {
  content: ReactNode
  iconClassName?: string
  openDelay?: number
}

export const InfoTooltip = ({ 
  content, 
  iconClassName,
  openDelay = 200 
}: InfoTooltipProps) => {
  return (
    <HoverCard openDelay={openDelay}>
      <HoverCardTrigger>
        <Info className={cn("w-4 h-4 text-muted-foreground", iconClassName)} />
      </HoverCardTrigger>
      <HoverCardContent>
        {content}
      </HoverCardContent>
    </HoverCard>
  )
}

