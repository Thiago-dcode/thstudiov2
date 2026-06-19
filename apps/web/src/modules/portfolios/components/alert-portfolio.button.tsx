"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePortfolio } from "../providers/create-update-portfolio.provider";

export function AlertPortfolioButton() {
 const { formData, currentPortfolio, isPending, portfolioItems } =
 usePortfolio();
 const pathname = usePathname();
 const [dismissed, setDismissed] = useState(false);

 const isOnPortfolioPage = pathname.startsWith("/atelier/portfolios");

 const hasUnsavedWork =
 isPending ||
 !!currentPortfolio ||
 !!(
 formData.title ||
 formData.slug ||
 formData.description ||
 portfolioItems.length
 );

 if (!hasUnsavedWork || isOnPortfolioPage || dismissed) return null;

 const href = currentPortfolio
 ? `/atelier/portfolios/edit/${currentPortfolio.slug}`
 : "/atelier/portfolios/create";

 const label = currentPortfolio ? "Editing portfolio" : "Creating portfolio";

 return (
 <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1">
 <Link
 href={href}
 className="flex items-center gap-2 border border-border bg-bg px-4 py-2 text-sm font-medium text-text shadow-lg transition-opacity hover:opacity-80"
 >
 <span className="relative flex size-2">
 <span className="absolute inline-flex size-full animate-ping bg-white opacity-75" />
 <span className="relative inline-flex size-2 bg-white" />
 </span>
 {label}
 <ArrowRight className="size-4" />
 </Link>
 <button
 type="button"
 onClick={() => setDismissed(true)}
 className=" border border-border bg-bg p-1.5 text-text-muted shadow-lg transition-colors hover:text-text"
 >
 <X className="size-3.5" />
 </button>
 </div>
 );
}
