"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import {
 ExternalLink,
 Menu,
 PanelLeftClose,
 PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { useUserMetrics } from "@/modules/users/providers/user-metrics.provider";
import { useMainNav } from "../providers/main-nav.provider";

export const TopNav = ({ username }: { username?: string }) => {
 const { shrinked, toggleShrinked, toggleMobile } = useMainNav();
 const { metrics } = useUserMetrics();

 return (
 <nav className="border-b border-b-fg-2 w-full h-16 shrink-0 flex items-center justify-between px-4">
 <div className="flex items-center">
 <button
 type="button"
 onClick={toggleMobile}
 className="md:hidden p-1.5 text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
 aria-label="Open menu"
 >
 <Menu size={18} />
 </button>
 <button
 type="button"
 onClick={toggleShrinked}
 className="hidden md:block p-1.5 text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
 aria-label={shrinked ? "Expand sidebar" : "Collapse sidebar"}
 >
 {shrinked ? (
 <PanelLeftOpen size={18} />
 ) : (
 <PanelLeftClose size={18} />
 )}
 </button>
 </div>

 <div className="flex items-center justify-center gap-4">
 {metrics?.active_plan && !metrics.active_plan.top_tier && (
 <Link href={"/atelier/settings/subscription"}>
 <Button variant={"primary"} size={"sm"}>
 Updgrade
 </Button>
 </Link>
 )}
 {username && (
 <a
 href={`/artists/${username}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
 >
 <span className="hidden sm:inline">View profile</span>
 <ExternalLink size={14} />
 </a>
 )}
 </div>
 </nav>
 );
};
