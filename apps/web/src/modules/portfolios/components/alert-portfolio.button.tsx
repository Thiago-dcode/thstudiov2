"use client";

import { useState } from "react";
import { usePortfolio } from "../providers/create-update-portfolio.provider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

export function AlertPortfolioButton() {
  const { formData, currentPortfolio, isPending } = usePortfolio();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const isOnPortfolioPage = pathname.startsWith("/atelier/portfolio");

  const hasUnsavedWork =
    isPending ||
    !!currentPortfolio ||
    !!(formData.title || formData.slug || formData.description || formData.media?.length);

  if (!hasUnsavedWork || isOnPortfolioPage || dismissed) return null;

  const href = currentPortfolio
    ? `/atelier/portfolio/edit/${currentPortfolio.slug}`
    : "/atelier/portfolio/create";

  const label = currentPortfolio
    ? "Editing portfolio"
    : "Creating portfolio";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1">
      <Link
        href={href}
        className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-text shadow-lg transition-opacity hover:opacity-80"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        {label}
        <ArrowRight className="size-4" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-full border border-border bg-background p-1.5 text-text-muted shadow-lg transition-colors hover:text-text"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
