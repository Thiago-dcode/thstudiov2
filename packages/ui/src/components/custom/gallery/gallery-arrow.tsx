import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../../lib/utils"

type GalleryArrowProps = {
 direction: "left" | "right"
 onClick: () => void
 className?: string
}

const icons = {
 left: ChevronLeft,
 right: ChevronRight,
}

export const GalleryArrow = ({ direction, onClick, className }: GalleryArrowProps) => {
 const Icon = icons[direction]

 return (
 <button
 onClick={onClick}
 className={cn(
 "absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 text-white/30 hover:text-white/80 transition-colors duration-200 focus:outline-none hidden tablet:block",
 direction === "left" && "left-3",
 direction === "right" && "right-3",
 className,
 )}
 aria-label={direction === "left" ? "Previous image" : "Next image"}
 >
 <Icon className="size-7" strokeWidth={1.5} />
 </button>
 )
}
